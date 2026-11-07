(*---
description: "belchDEF stops scanning at a THEOREM token even when it is a field name, so the next definition gets no definition marker and fails to parse."
ref: "tla2sany/parser/TLAplusParser.java#belchDEF"
features: [fields, tlc-bug]
outcome: parse-error
---*)
---- MODULE keyword_field_blocks_next_definition_theorem ----
Op == [THEOREM |-> 3].THEOREM
Next == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "Next" at line 9, column 1 and token "THEOREM" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file keyword_field_blocks_next_definition_theorem
    | In module keyword_field_blocks_next_definition_theorem
    | Could not parse module keyword_field_blocks_next_definition_theorem from file keyword_field_blocks_next_definition_theorem.tla
    | *** Errors: 1
    | In module keyword_field_blocks_next_definition_theorem
    | Could not parse module keyword_field_blocks_next_definition_theorem from file keyword_field_blocks_next_definition_theorem.tla
    3002:1 Parsing or semantic analysis failed.
---*)
