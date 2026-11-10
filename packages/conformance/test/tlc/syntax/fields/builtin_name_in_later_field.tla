(*---
description: "TRUE is an identifier to the parser, so it may be any field and only draws a warning."
ref: "tla2sany/semantic/ErrorCode.java#RECORD_CONSTRUCTOR_FIELD_NAME_CLASH"
features: [fields]
flags: [expression]
outcome: success
---*)
---- MODULE builtin_name_in_later_field ----
Test == [a |-> 1, TRUE |-> 2].TRUE = 2
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | line 9, col 19 to line 9, col 22 of module builtin_name_in_later_field
    | The field name "TRUE" in the record constructor is identical to the existing definition or declaration
    | named TRUE, located at In module --TLA+ BUILTINS--.
    | The field in the record will not take the value of the TRUE definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [TRUE |-> ...] = {"TRUE"} holds true.
---*)
