(*---
description: SUBSET may be the first field in a record constructor and the name after a dot.
ref: "tla2sany/parser/TLAplusParser.java#isFieldNameToken"
features: [fields]
flags: [expression]
outcome: success
---*)
---- MODULE keyword_first_field_subset ----
Test == [SUBSET |-> 3].SUBSET = 3
====

(*--- recorded
all:
  exit: 0
  transcript: |-
    | line 9, col 10 to line 9, col 15 of module keyword_first_field_subset
    | The field name "SUBSET" in the record constructor is identical to the existing definition or declaration
    | named SUBSET, located at In module --TLA+ BUILTINS--.
    | The field in the record will not take the value of the SUBSET definition or declaration.
    | In TLA+, field names in records are strings, regardless of any similarly named declarations or definitions.
    | Therefore, DOMAIN [SUBSET |-> ...] = {"SUBSET"} holds true.
---*)
