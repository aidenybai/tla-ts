(*---
description: "A RECURSIVE declaration cannot spell an operator slot as _(_)."
ref: "tla2sany/parser/TLAplusParser.java#Recursive"
flags: [expression]
outcome: parse-error
---*)
---- MODULE operator_slot_in_declaration_rejected ----
EXTENDS Integers
RECURSIVE Map(_(_), _)
Map(f(_), s) == s
Test == Map(LAMBDA x : x, 1) = 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "comma or )"
    | Encountered "(" at line 9, column 16 and token "_" 
    | Residual stack trace follows:
    | Constant declaration items starting at line 9, column 11.
    | Recursive starting at line 9, column 1.
    | Module body starting at line 9, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file operator_slot_in_declaration_rejected
    | In module operator_slot_in_declaration_rejected
    | Could not parse module operator_slot_in_declaration_rejected from file operator_slot_in_declaration_rejected.tla
    | *** Errors: 1
    | In module operator_slot_in_declaration_rejected
    | Could not parse module operator_slot_in_declaration_rejected from file operator_slot_in_declaration_rejected.tla
    3002:1 Parsing or semantic analysis failed.
---*)
