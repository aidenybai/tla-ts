(*---
description: "DOMAIN of a lazy multi-bound function is the product of its bounds."
ref: "tlc2/value/impl/FcnLambdaValue.java#getDomain"
flags: [expression]
outcome: success
---*)
---- MODULE multi_argument_lazy_domain_is_product ----
EXTENDS Integers
Test == DOMAIN [x \in Nat, y \in {1} |-> x] = Nat \X {1}
====

(*--- recorded
all:
  exit: 0
---*)
