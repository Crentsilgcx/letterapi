package com.office.letterreceipt.dto;

import jakarta.validation.constraints.Size;

public record ReceiveDeliveryRequest(@Size(max = 500) String remarks) {}
