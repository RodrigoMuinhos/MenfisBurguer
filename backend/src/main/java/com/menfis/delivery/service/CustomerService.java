package com.menfis.delivery.service;

import com.menfis.delivery.dto.ApiDtos.CustomerLoginRequest;
import com.menfis.delivery.dto.ApiDtos.CustomerProfileRequest;
import com.menfis.delivery.dto.ApiDtos.CustomerProfileResponse;
import com.menfis.delivery.dto.ApiDtos.CustomerSessionResponse;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerService {
  private final JdbcTemplate jdbc;
  private final AuthService auth;
  private final PasswordEncoder encoder;
  private final SecureRandom random = new SecureRandom();

  public CustomerService(JdbcTemplate jdbc, AuthService auth, PasswordEncoder encoder) {
    this.jdbc = jdbc;
    this.auth = auth;
    this.encoder = encoder;
  }

  @Transactional
  public CustomerSessionResponse upsertSession(CustomerProfileRequest request) {
    String phoneDigits = digits(request.phone());
    String cpfDigits = digits(request.cpf());
    String email = clean(request.email());
    String password = request.password() == null ? "" : request.password().trim();
    String confirmPassword = request.confirmPassword() == null ? "" : request.confirmPassword().trim();
    if (phoneDigits.length() < 10 || isBlank(request.name()) || isBlank(request.email())) {
      throw new IllegalArgumentException("customer_name_phone_email_required");
    }
    if (!cpfDigits.isBlank() && cpfDigits.length() != 11) {
      throw new IllegalArgumentException("customer_cpf_invalid");
    }
    if (password.length() != 6) {
      throw new IllegalArgumentException("customer_password_required");
    }
    if (!password.equals(confirmPassword)) {
      throw new IllegalArgumentException("customer_password_confirmation_mismatch");
    }

    Long id = findCustomerId(cpfDigits, email, phoneDigits);

    if (id == null) {
      id = jdbc.queryForObject(
        """
        insert into customers (name, phone, phone_digits, email, cpf, birthday, password_hash, last_login_at, updated_at)
        values (?, ?, ?, ?, ?, ?, ?, now(), now())
        returning id
        """,
        Long.class,
        request.name().trim(),
        request.phone(),
        phoneDigits,
        email,
        cpfDigits.isBlank() ? null : cpfDigits,
        request.birthday(),
        encoder.encode(password)
      );
    } else {
      jdbc.update(
        """
        update customers set name = ?, phone = ?, phone_digits = ?, email = ?, cpf = coalesce(?, cpf), birthday = ?,
          last_login_at = now(), updated_at = now()
        where id = ?
        """,
        request.name().trim(),
        request.phone(),
        phoneDigits,
        email,
        cpfDigits.isBlank() ? null : cpfDigits,
        request.birthday(),
        id
      );
      jdbc.update("update customers set password_hash = ?, updated_at = now() where id = ?", encoder.encode(password), id);
    }

    saveDefaultAddress(id, request);
    CustomerProfileResponse profile = profile(id);
    return new CustomerSessionResponse(auth.customerSession(id).token(), "CUSTOMER", profile);
  }

  @Transactional
  public CustomerSessionResponse login(CustomerLoginRequest request) {
    String login = request.login() == null ? "" : request.login().trim().toLowerCase(Locale.ROOT);
    String cpfDigits = digits(login);
    String password = request.password() == null ? "" : request.password().trim();
    if (login.isBlank() || password.length() != 6) {
      throw new IllegalArgumentException("invalid_customer_credentials");
    }

    CustomerCredential credential = findCredential(login, cpfDigits);
    if (credential == null || credential.passwordHash() == null || !encoder.matches(password, credential.passwordHash())) {
      throw new IllegalArgumentException("invalid_customer_credentials");
    }
    jdbc.update("update customers set last_login_at = now(), updated_at = now() where id = ?", credential.id());
    CustomerProfileResponse profile = profile(credential.id());
    return new CustomerSessionResponse(auth.customerSession(credential.id()).token(), "CUSTOMER", profile);
  }

  public CustomerProfileResponse profile(long customerId) {
    return jdbc.queryForObject(
      """
      select c.*,
        (select count(*) from orders o where o.customer_id = c.id) as order_count,
        (select coalesce(sum(o.total), 0) from orders o where o.status <> 'CANCELLED' and o.customer_id = c.id) as total_spent,
        (select max(o.created_at) from orders o where o.customer_id = c.id) as last_order_at
      from customers c
      where c.id = ?
      """,
      (rs, rowNum) -> mapProfile(rs, defaultAddress(customerId)),
      customerId
    );
  }

  public List<Map<String, Object>> crm() {
    return jdbc.queryForList(
      """
      with profiles as (
        select distinct on (c.phone_digits)
          c.id,
          c.phone_digits,
          c.name,
          c.phone,
          c.email,
          c.cpf,
          c.internal_notes,
          c.created_at,
          c.birthday,
          c.last_login_at,
          c.updated_at
        from customers c
        where c.phone_digits is not null and c.phone_digits <> ''
        order by c.phone_digits, c.last_login_at desc nulls last, c.updated_at desc nulls last, c.id desc
      ),
      order_stats as (
        select
          coalesce(c.phone_digits, regexp_replace(coalesce(o.customer_phone, ''), '\\D', '', 'g')) as phone_digits,
          count(o.id) as order_count,
          coalesce(sum(case when o.status <> 'CANCELLED' then o.total else 0 end), 0) as total_spent,
          max(o.created_at) as last_order_at
        from orders o
        left join customers c on c.id = o.customer_id
        group by coalesce(c.phone_digits, regexp_replace(coalesce(o.customer_phone, ''), '\\D', '', 'g'))
      )
      select
        p.id,
        p.name,
        p.phone,
        p.email,
        p.cpf,
        p.internal_notes,
        p.created_at,
        p.birthday,
        p.last_login_at,
        coalesce(os.order_count, 0) as order_count,
        coalesce(os.total_spent, 0) as total_spent,
        case when coalesce(os.order_count, 0) > 0 then coalesce(os.total_spent, 0) / os.order_count else 0 end as average_ticket,
        coalesce((
          select count(*) from orders o
          where o.status = 'DELIVERED'
            and o.delivery_type = 'DELIVERY'
            and (o.customer_id = p.id or regexp_replace(coalesce(o.customer_phone, ''), '\\D', '', 'g') = p.phone_digits)
        ), 0) as delivered_count,
        os.last_order_at,
        min(a.cep) as cep,
        min(a.street) as street,
        min(a.house_number) as number,
        min(a.neighborhood) as neighborhood,
        min(a.city) as city
      from profiles p
      left join order_stats os on os.phone_digits = p.phone_digits
      left join addresses a on a.customer_id = p.id and a.is_default = true
      group by p.id, p.phone_digits, p.name, p.phone, p.email, p.cpf, p.internal_notes, p.created_at, p.birthday, p.last_login_at, p.updated_at, os.order_count, os.total_spent, os.last_order_at
      order by os.last_order_at desc nulls last, p.updated_at desc
      limit 500
      """
    );
  }

  @Transactional
  public Map<String, Object> createAdminCustomer(Map<String, Object> request) {
    String phone = clean(stringValue(request.get("phone")));
    String phoneDigits = digits(phone);
    String name = clean(stringValue(request.get("name")));
    String email = clean(stringValue(request.get("email")));
    String cpf = digits(stringValue(request.get("cpf")));
    String notes = clean(stringValue(request.get("internalNotes")));
    if (phoneDigits.length() < 10) throw new IllegalArgumentException("customer_phone_required");
    if (isBlank(name)) name = "Cliente " + phone;
    if (!cpf.isBlank() && cpf.length() != 11) throw new IllegalArgumentException("customer_cpf_invalid");

    Long existing = findCustomerId(cpf, email, phoneDigits);
    if (existing != null) {
      updateAdminCustomer(existing, request);
      return adminCustomerResponse(existing, null);
    }

    String tempPassword = temporaryPassword();
    Long id = jdbc.queryForObject(
      """
      insert into customers (name, phone, phone_digits, email, cpf, internal_notes, password_hash, updated_at)
      values (?, ?, ?, ?, ?, ?, ?, now())
      returning id
      """,
      Long.class,
      name,
      phone,
      phoneDigits,
      email,
      cpf.isBlank() ? null : cpf,
      notes,
      encoder.encode(tempPassword)
    );
    return adminCustomerResponse(id, tempPassword);
  }

  @Transactional
  public Map<String, Object> updateAdminCustomer(long id, Map<String, Object> request) {
    String phone = clean(stringValue(request.get("phone")));
    String phoneDigits = digits(phone);
    String name = clean(stringValue(request.get("name")));
    String email = clean(stringValue(request.get("email")));
    String cpf = digits(stringValue(request.get("cpf")));
    String notes = clean(stringValue(request.get("internalNotes")));
    if (phoneDigits.length() < 10) throw new IllegalArgumentException("customer_phone_required");
    if (isBlank(name)) throw new IllegalArgumentException("customer_name_required");
    if (!cpf.isBlank() && cpf.length() != 11) throw new IllegalArgumentException("customer_cpf_invalid");
    jdbc.update(
      """
      update customers set name = ?, phone = ?, phone_digits = ?, email = ?, cpf = ?, internal_notes = ?, updated_at = now()
      where id = ?
      """,
      name,
      phone,
      phoneDigits,
      email,
      cpf.isBlank() ? null : cpf,
      notes,
      id
    );
    return adminCustomerResponse(id, null);
  }

  @Transactional
  public void deleteAdminCustomer(long id) {
    jdbc.update("update orders set customer_id = null where customer_id = ?", id);
    jdbc.update("delete from addresses where customer_id = ?", id);
    jdbc.update("delete from customers where id = ?", id);
  }

  @Transactional
  public Map<String, Object> generateTemporaryPassword(long id) {
    String tempPassword = temporaryPassword();
    jdbc.update("update customers set password_hash = ?, updated_at = now() where id = ?", encoder.encode(tempPassword), id);
    return adminCustomerResponse(id, tempPassword);
  }

  @Transactional
  public Map<String, Object> requestPasswordRecovery(Map<String, Object> request) {
    CustomerCredential credential = findCredentialByLogin(stringValue(request.get("login")));
    if (credential == null) throw new IllegalArgumentException("customer_not_found");
    String code = recoveryCode();
    jdbc.update(
      """
      insert into customer_password_recovery_codes(customer_id, code_hash, expires_at)
      values (?, ?, now() + interval '10 minutes')
      """,
      credential.id(),
      encoder.encode(code)
    );
    Map<String, Object> response = new HashMap<>(adminCustomerResponse(credential.id(), null));
    response.put("expiresInMinutes", 10);
    response.put("delivery", "requested");
    return response;
  }

  @Transactional
  public CustomerSessionResponse resetPassword(Map<String, Object> request) {
    CustomerCredential credential = findCredentialByLogin(stringValue(request.get("login")));
    String code = stringValue(request.get("code")).trim();
    String password = stringValue(request.get("password")).trim();
    String confirmPassword = stringValue(request.get("confirmPassword")).trim();
    if (credential == null || code.length() != 6) throw new IllegalArgumentException("invalid_recovery_code");
    if (password.length() != 6 || !password.equals(confirmPassword)) throw new IllegalArgumentException("invalid_new_password");
    List<Map<String, Object>> rows = jdbc.queryForList(
      """
      select id, code_hash from customer_password_recovery_codes
      where customer_id = ? and used_at is null and expires_at > now()
      order by created_at desc
      limit 5
      """,
      credential.id()
    );
    Map<String, Object> match = rows.stream()
      .filter(row -> encoder.matches(code, String.valueOf(row.get("code_hash"))))
      .findFirst()
      .orElseThrow(() -> new IllegalArgumentException("invalid_recovery_code"));
    jdbc.update("update customer_password_recovery_codes set used_at = now() where id = ?", match.get("id"));
    jdbc.update("update customers set password_hash = ?, updated_at = now() where id = ?", encoder.encode(password), credential.id());
    CustomerProfileResponse profile = profile(credential.id());
    return new CustomerSessionResponse(auth.customerSession(credential.id()).token(), "CUSTOMER", profile);
  }

  public Long findCustomerIdByPhone(String rawPhone) {
    String phoneDigits = digits(rawPhone);
    if (phoneDigits.length() < 10) return null;
    var candidates = phoneCandidates(phoneDigits);
    try {
      return jdbc.queryForObject(
        "select id from customers where phone_digits in (?, ?) order by last_login_at desc nulls last, updated_at desc nulls last, id desc limit 1",
        Long.class,
        candidates.get(0),
        candidates.get(1)
      );
    } catch (EmptyResultDataAccessException ex) {
      return null;
    }
  }

  private Long findCustomerId(String cpfDigits, String email, String phoneDigits) {
    if (!cpfDigits.isBlank()) {
      Long id = findCustomerIdByCpf(cpfDigits);
      if (id != null) return id;
    }
    if (!isBlank(email)) {
      Long id = findCustomerIdByEmail(email);
      if (id != null) return id;
    }
    return findCustomerIdByPhone(phoneDigits);
  }

  private Long findCustomerIdByCpf(String cpfDigits) {
    try {
      return jdbc.queryForObject(
        "select id from customers where cpf = ? order by last_login_at desc nulls last, updated_at desc nulls last, id desc limit 1",
        Long.class,
        cpfDigits
      );
    } catch (EmptyResultDataAccessException ex) {
      return null;
    }
  }

  private Long findCustomerIdByEmail(String email) {
    try {
      return jdbc.queryForObject(
        "select id from customers where lower(email) = lower(?) order by last_login_at desc nulls last, updated_at desc nulls last, id desc limit 1",
        Long.class,
        email
      );
    } catch (EmptyResultDataAccessException ex) {
      return null;
    }
  }

  private CustomerCredential findCredential(String login, String cpfDigits) {
    var candidates = phoneCandidates(digits(login));
    try {
      return jdbc.queryForObject(
        """
        select id, password_hash
        from customers
        where lower(email) = lower(?) or phone_digits in (?, ?) or (? <> '' and cpf = ?)
        order by last_login_at desc nulls last, updated_at desc nulls last, id desc
        limit 1
        """,
        (rs, rowNum) -> new CustomerCredential(rs.getLong("id"), rs.getString("password_hash")),
        login,
        candidates.get(0),
        candidates.get(1),
        cpfDigits,
        cpfDigits
      );
    } catch (EmptyResultDataAccessException ex) {
      return null;
    }
  }

  private CustomerCredential findCredentialByLogin(String rawLogin) {
    String login = rawLogin == null ? "" : rawLogin.trim().toLowerCase(Locale.ROOT);
    String digits = digits(login);
    var candidates = phoneCandidates(digits);
    if (login.isBlank()) return null;
    try {
      return jdbc.queryForObject(
        """
        select id, password_hash
        from customers
        where lower(email) = lower(?) or phone_digits in (?, ?) or (? <> '' and cpf = ?)
        order by last_login_at desc nulls last, updated_at desc nulls last, id desc
        limit 1
        """,
        (rs, rowNum) -> new CustomerCredential(rs.getLong("id"), rs.getString("password_hash")),
        login,
        candidates.get(0),
        candidates.get(1),
        digits,
        digits
      );
    } catch (EmptyResultDataAccessException ex) {
      return null;
    }
  }

  private void saveDefaultAddress(long customerId, CustomerProfileRequest request) {
    if (isBlank(request.cep()) && isBlank(request.street()) && isBlank(request.number())) return;
    jdbc.update("update addresses set is_default = false where customer_id = ?", customerId);
    jdbc.update(
      """
      insert into addresses (customer_id, label, cep, street, house_number, complement, neighborhood, city, reference, is_default)
      values (?, 'Principal', ?, ?, ?, ?, ?, ?, ?, true)
      """,
      customerId,
      clean(request.cep()),
      clean(request.street()),
      clean(request.number()),
      clean(request.complement()),
      clean(request.neighborhood()),
      clean(request.city()),
      clean(request.reference())
    );
  }

  private Map<String, Object> defaultAddress(long customerId) {
    List<Map<String, Object>> rows = jdbc.queryForList(
      """
      select id, label, cep, street, house_number as number, complement, neighborhood, city, reference
      from addresses
      where customer_id = ? and is_default = true
      order by created_at desc
      limit 1
      """,
      customerId
    );
    return rows.isEmpty() ? Map.of() : rows.get(0);
  }

  private CustomerProfileResponse mapProfile(ResultSet rs, Map<String, Object> address) throws SQLException {
    return new CustomerProfileResponse(
      rs.getLong("id"),
      rs.getString("name"),
      rs.getString("phone"),
      rs.getString("email"),
      rs.getObject("birthday", java.time.LocalDate.class),
      rs.getString("avatar_url"),
      address,
      rs.getLong("order_count"),
      rs.getBigDecimal("total_spent") == null ? BigDecimal.ZERO : rs.getBigDecimal("total_spent"),
      rs.getObject("last_order_at", OffsetDateTime.class),
      !isBlank(rs.getString("password_hash"))
    );
  }

  private Map<String, Object> adminCustomerResponse(long id, String temporaryPassword) {
    Map<String, Object> row = jdbc.queryForMap(
      """
      select c.id, c.name, c.phone, c.email, c.cpf, c.internal_notes, c.created_at,
        (select count(*) from orders o where o.customer_id = c.id) as order_count,
        (select coalesce(sum(o.total), 0) from orders o where o.status <> 'CANCELLED' and o.customer_id = c.id) as total_spent,
        (select max(o.created_at) from orders o where o.customer_id = c.id) as last_order_at,
        (select count(*) from orders o where o.status = 'DELIVERED' and o.delivery_type = 'DELIVERY' and o.customer_id = c.id) as delivered_count
      from customers c
      where c.id = ?
      """,
      id
    );
    if (temporaryPassword != null) {
      row.put("temporaryPassword", temporaryPassword);
      row.put("whatsappUrl", temporaryPasswordWhatsappUrl(row, temporaryPassword));
    }
    return row;
  }

  private String temporaryPassword() {
    return String.format("%06d", random.nextInt(1_000_000));
  }

  private String recoveryCode() {
    return temporaryPassword();
  }

  private String temporaryPasswordWhatsappUrl(Map<String, Object> customer, String password) {
    String phone = digits(String.valueOf(customer.get("phone")));
    String normalized = phone.startsWith("55") ? phone : "55" + phone;
    String message = "Olá, sua senha de acesso ao Menfi's Burger foi redefinida.\n\n"
      + "Login: " + customer.get("phone") + "\n"
      + "Senha temporária: " + password + "\n\n"
      + "Por segurança, altere sua senha após o primeiro acesso.";
    return "https://wa.me/" + normalized + "?text=" + java.net.URLEncoder.encode(message, java.nio.charset.StandardCharsets.UTF_8);
  }

  private String passwordRecoveryWhatsappUrl(Map<String, Object> customer, String code) {
    String phone = digits(String.valueOf(customer.get("phone")));
    String normalized = phone.startsWith("55") ? phone : "55" + phone;
    String message = "Olá, seu código de recuperação do Menfi's Burger é: " + code
      + "\n\nEle expira em 10 minutos. Não compartilhe esse código.";
    return "https://wa.me/" + normalized + "?text=" + java.net.URLEncoder.encode(message, java.nio.charset.StandardCharsets.UTF_8);
  }

  private String stringValue(Object value) {
    return value == null ? "" : String.valueOf(value);
  }

  private String digits(String value) {
    return value == null ? "" : value.replaceAll("\\D", "");
  }

  private List<String> phoneCandidates(String value) {
    String phone = digits(value);
    if (phone.startsWith("55") && phone.length() > 11) {
      return List.of(phone, phone.substring(2));
    }
    if (phone.length() >= 10 && !phone.startsWith("55")) {
      return List.of(phone, "55" + phone);
    }
    return List.of(phone, phone);
  }

  private String clean(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private boolean isBlank(String value) {
    return value == null || value.trim().isBlank();
  }

  private record CustomerCredential(long id, String passwordHash) {}
}
