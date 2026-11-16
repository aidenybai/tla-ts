(*---
description: "A record field equal to a definition's name only warns."
ref: "tla2sany/semantic/Generator.java#generateExpression"
features: [error_codes]
flags: [expression]
outcome: success
---*)
---- MODULE record_field_same_as_definition_warns ----
x == 1
Test == [x |-> 2].x = 2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | line 10, col 10 to line 10, col 10 of module record_field_same_as_definition_warns
    | The field name "x" in the record constructor is identical to the existing definition or declaration
    | named x, located at line 9, col 1 to line 9, col 6 of module record_field_same_as_definition_warns.
    | The field in the record will not take the value of the x definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [x |-> ...] = {"x"} holds true.
---*)
