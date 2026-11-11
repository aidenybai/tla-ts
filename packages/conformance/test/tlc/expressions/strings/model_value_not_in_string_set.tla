(*---
description: "An untyped model value is not in STRING."
ref: "tlc2/module/Strings.java#member"
flags: [expression]
outcome: success
config: |
  CONSTANT mv = mv
---*)
---- MODULE model_value_not_in_string_set ----
EXTENDS Integers
CONSTANT mv
Test == mv \notin STRING
====

(*--- recorded
all:
  exit: 0
---*)
