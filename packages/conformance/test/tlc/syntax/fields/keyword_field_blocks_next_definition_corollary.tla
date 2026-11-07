(*---
description: "belchDEF stops scanning at a COROLLARY token even when it is a field name, so the next definition gets no definition marker and fails to parse."
ref: "tla2sany/parser/TLAplusParser.java#belchDEF"
features: [fields, tlc-bug]
outcome: parse-error
---*)
---- MODULE keyword_field_blocks_next_definition_corollary ----
Op == [COROLLARY |-> 3].COROLLARY
Next == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "==== or more Module body"
    | Encountered "Next" at line 9, column 1 and token "COROLLARY" 
    | Residual stack trace follows:
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file keyword_field_blocks_next_definition_corollary
    | In module keyword_field_blocks_next_definition_corollary
    | Could not parse module keyword_field_blocks_next_definition_corollary from file keyword_field_blocks_next_definition_corollary.tla
    | *** Errors: 1
    | In module keyword_field_blocks_next_definition_corollary
    | Could not parse module keyword_field_blocks_next_definition_corollary from file keyword_field_blocks_next_definition_corollary.tla
    3002:1 Parsing or semantic analysis failed.
---*)
