package org.example;

import org.example.entity.Role;
import org.example.entity.User;
import org.example.repository.RoleRepository;
import org.example.repository.UserRepository;
import org.modelmapper.ModelMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@SpringBootApplication
public class SpringRestTestApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpringRestTestApplication.class, args);
    }

    @Bean
    public ModelMapper modelMapper() {
        return new ModelMapper();
    }
    /**
     * Инициализация ролей и пользователей при первом запуске.
     * Выполняется ОДИН РАЗ, в транзакции, после старта БД.
     */
    @Bean
    @Transactional
    public CommandLineRunner initUsers(UserRepository userRepository,
                                       RoleRepository roleRepository,
                                       PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.count() > 0 || roleRepository.count() > 0) {
                System.out.println("The database already exists user data and role!");
                return;
            }

            System.out.println("Creating and initialize users...");

            Role roleAdmin = new Role(null, "ROLE_ADMIN");
            roleAdmin = roleRepository.save(roleAdmin);

            Role roleUser = new Role(null, "ROLE_USER");
            roleUser = roleRepository.save(roleUser);

            User admin = User.builder()
                    .email("admin@gmail.com")
                    .password(passwordEncoder.encode("admin"))
                    .name("admin")
                    .age(25)
                    .roles(Set.of(roleAdmin, roleUser))
                    .build();
            userRepository.save(admin);

            User user = User.builder()
                    .email("user@gmail.com")
                    .password(passwordEncoder.encode("user"))
                    .name("user")
                    .age(30)
                    .roles(Set.of(roleUser))
                    .build();
            userRepository.save(user);

            System.out.println("Created:");
            System.out.println("    -ROLE_ADMIN, ROLE_USER");
            System.out.println("username(email) - \"admin@gmail.com\" | password: \"admin\"");
            System.out.println("username(email) - \"user@gmail.com\" | password: \"user\"");
        };

    }

}
