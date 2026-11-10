(*---
description: "After EXCEPT the other keys of a lazy function have not been evaluated."
ref: "tlc2/value/impl/FcnLambdaValue.java#takeExcept"
flags: [expression]
outcome: success
---*)
---- MODULE lazy_function_except_leaves_other_keys_unevaluated ----
EXTENDS Integers
Test == [[x \in Nat |-> IF x = 1 THEN 0 ELSE 1 \div 0] EXCEPT ![1] = 5][1] = 5
====

(*--- recorded
all:
  exit: 0
---*)
