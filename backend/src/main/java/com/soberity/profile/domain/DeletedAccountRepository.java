package com.soberity.profile.domain;

import org.springframework.data.jpa.repository.JpaRepository;

public interface DeletedAccountRepository extends JpaRepository<DeletedAccount, String> {
}
