(*---
description: "A field may reuse the name of a defined operator, which does not take the operator value."
ref: "tla2sany/semantic/Generator.java#processRcdForm"
features: [identifiers]
flags: [expression]
outcome: success
---*)
---- MODULE name_shares_with_field ----
a == 9
Test == [a |-> 1].a = 1 /\ DOMAIN [a |-> 1] = {"a"}
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | line 10, col 10 to line 10, col 10 of module name_shares_with_field
    | The field name "a" in the record constructor is identical to the existing definition or declaration
    | named a, located at line 9, col 1 to line 9, col 6 of module name_shares_with_field.
    | The field in the record will not take the value of the a definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [a |-> ...] = {"a"} holds true.
    | line 10, col 36 to line 10, col 36 of module name_shares_with_field
    | The field name "a" in the record constructor is identical to the existing definition or declaration
    | named a, located at line 9, col 1 to line 9, col 6 of module name_shares_with_field.
    | The field in the record will not take the value of the a definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [a |-> ...] = {"a"} holds true.
---*)
