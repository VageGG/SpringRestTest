package org.example.service;

import org.example.dto.RoleDto;
import org.example.repository.RoleRepository;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final ModelMapper modelMapper;

    public RoleService(RoleRepository roleRepository, ModelMapper modelMapper) {
        this.roleRepository = roleRepository;
        this.modelMapper = modelMapper;
    }

    public List<RoleDto> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(r -> modelMapper.map(r, RoleDto.class))
                .collect(Collectors.toList());
    }
}
