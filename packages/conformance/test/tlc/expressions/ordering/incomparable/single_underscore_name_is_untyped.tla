(*---
description: "A name with _ at position 1 but length 2 is untyped, because typing requires length above 2."
ref: "tlc2/value/impl/ModelValue.java#ModelValue"
flags: [expression]
outcome: success
config: |
  CONSTANT t_ = t_
---*)
---- MODULE single_underscore_name_is_untyped ----
EXTENDS Integers
CONSTANT t_
Test == t_ # 1
====

(*--- recorded
all:
  exit: 0
---*)
