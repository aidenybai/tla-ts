(*---
description: "An untyped model value is not in a set of records."
ref: "tlc2/value/impl/SetOfRcdsValue.java#member"
flags: [expression]
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE member_model_value ----
EXTENDS Integers
CONSTANT mv
Test == mv \notin [a : {1}]
====

(*--- recorded
all:
  exit: 0
---*)
