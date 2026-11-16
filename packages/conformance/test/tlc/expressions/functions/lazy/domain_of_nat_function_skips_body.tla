(*---
description: "A function over Nat stays lazy under DOMAIN, so its body never runs."
ref: "tlc2/value/impl/FcnLambdaValue.java#getDomain"
flags: [expression]
outcome: success
---*)
---- MODULE domain_of_nat_function_skips_body ----
EXTENDS Integers
Test == 1 \in DOMAIN [x \in Nat |-> 1 \div 0]
====

(*--- recorded
all:
  exit: 0
---*)
