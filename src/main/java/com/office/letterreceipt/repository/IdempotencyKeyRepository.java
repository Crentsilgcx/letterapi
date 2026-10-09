package com.office.letterreceipt.repository;

import com.office.letterreceipt.model.IdempotencyKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface IdempotencyKeyRepository extends JpaRepository<IdempotencyKey, String> {
    Optional<IdempotencyKey> findByIdempotencyKey(String idempotencyKey);

    void deleteByExpiresAtBefore(LocalDateTime now);
}