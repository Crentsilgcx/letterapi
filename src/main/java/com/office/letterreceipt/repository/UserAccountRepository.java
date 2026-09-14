package com.office.letterreceipt.repository;
import com.office.letterreceipt.model.UserAccount;
import java.util.*;
import org.springframework.data.jpa.repository.JpaRepository;
public interface UserAccountRepository extends JpaRepository<UserAccount,Long>{
    Optional<UserAccount> findByUsernameIgnoreCase(String username);
    List<UserAccount> findAllByOrderByDisplayNameAsc();
    long countByRoleAndActiveTrue(com.office.letterreceipt.model.Role role);
}
