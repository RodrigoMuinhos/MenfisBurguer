package com.menfis.delivery.service;

import com.menfis.delivery.dto.ApiDtos.CustomerLoginRequest;
import com.menfis.delivery.dto.ApiDtos.CustomerProfileRequest;
import com.menfis.delivery.dto.ApiDtos.CustomerProfileResponse;
import com.menfis.delivery.dto.ApiDtos.CustomerSessionResponse;
import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
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
    if (phoneDigits.length() < 10 || isBlank(request.name()) || isBlank(request.email())) {
      throw new IllegalArgumentException("customer_name_phone_email_required");
    }
    if (!cpfDigits.isBlank() && cpfDigits.length() != 11) {
      throw new IllegalArgumentException("customer_cpf_invalid");
    }

    Long id = findCustomerId(cpfDigits, email, phoneDigits);
    boolean creating = id == null;
    if (creating && password.length() != 6) {
      throw new IllegalArgumentException("customer_password_required");
    }

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
      if (password.length() == 6) {
        jdbc.update("update customers set password_hash = ?, updated_at = now() where id = ?", encoder.encode(password), id);
      }
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
        (select count(*) from orders o where o.customer_id = c.id or regexp_replace(coalesce(o.customer_phone, ''), '\\D', '', 'g') = c.phone_digits) as order_count,
        (select coalesce(sum(o.total), 0) from orders o where o.status <> 'CANCELLED' and (o.customer_id = c.id or regexp_replace(coalesce(o.customer_phone, ''), '\\D', '', 'g') = c.phone_digits)) as total_spent,
        (select max(o.created_at) from orders o where o.customer_id = c.id or regexp_replace(coalesce(o.customer_phone, ''), '\\D', '', 'g') = c.phone_digits) as last_order_at
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
        p.birthday,
        p.last_login_at,
        coalesce(os.order_count, 0) as order_count,
        coalesce(os.total_spent, 0) as total_spent,
        os.last_order_at,
        min(a.cep) as cep,
        min(a.street) as street,
        min(a.house_number) as number,
        min(a.neighborhood) as neighborhood,
        min(a.city) as city
      from profiles p
      left join order_stats os on os.phone_digits = p.phone_digits
      left join addresses a on a.customer_id = p.id and a.is_default = true
      group by p.id, p.name, p.phone, p.email, p.birthday, p.last_login_at, p.updated_at, os.order_count, os.total_spent, os.last_order_at
      order by os.last_order_at desc nulls last, p.updated_at desc
      limit 500
      """
    );
  }

  public Long findCustomerIdByPhone(String rawPhone) {
    String phoneDigits = digits(rawPhone);
    if (phoneDigits.length() < 10) return null;
    try {
      return jdbc.queryForObject(
        "select id from customers where phone_digits = ? order by last_login_at desc nulls last, updated_at desc nulls last, id desc limit 1",
        Long.class,
        phoneDigits
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
    try {
      return jdbc.queryForObject(
        """
        select id, password_hash
        from customers
        where lower(email) = lower(?) or (? <> '' and cpf = ?)
        order by last_login_at desc nulls last, updated_at desc nulls last, id desc
        limit 1
        """,
        (rs, rowNum) -> new CustomerCredential(rs.getLong("id"), rs.getString("password_hash")),
        login,
        cpfDigits,
        cpfDigits
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

  private String digits(String value) {
    return value == null ? "" : value.replaceAll("\\D", "");
  }

  private String clean(String value) {
    return value == null || value.isBlank() ? null : value.trim();
  }

  private boolean isBlank(String value) {
    return value == null || value.trim().isBlank();
  }

  private record CustomerCredential(long id, String passwordHash) {}
}
