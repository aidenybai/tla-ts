(*---
description: "An untyped model value is not in a product, with no error."
ref: "tlc2/value/impl/SetOfTuplesValue.java#member"
flags: [expression]
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE member_model_value ----
EXTENDS Integers
CONSTANT mv
Test == mv \notin {1} \X {2}
====

(*--- recorded
all:
  exit: 0
---*)
