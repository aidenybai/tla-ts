(*---
description: UNION may be the first field in a record constructor and the name after a dot.
ref: "tla2sany/parser/TLAplusParser.java#isFieldNameToken"
features: [fields]
flags: [expression]
outcome: success
---*)
---- MODULE keyword_first_field_union ----
Test == [UNION |-> 3].UNION = 3
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | line 9, col 10 to line 9, col 14 of module keyword_first_field_union
    | The field name "UNION" in the record constructor is identical to the existing definition or declaration
    | named UNION, located at In module --TLA+ BUILTINS--.
    | The field in the record will not take the value of the UNION definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [UNION |-> ...] = {"UNION"} holds true.
---*)
