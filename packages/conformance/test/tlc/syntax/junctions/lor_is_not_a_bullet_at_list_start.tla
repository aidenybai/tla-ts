(*---
description: "\\land spelled out starts a list too, so a following /\\ aligned to it is the same list; a list cannot start after an infix without an operand."
ref: "tla2sany/parser/TLAplusParser.java#Junctions"
features: [junctions]
outcome: parse-error
---*)
---- MODULE lor_is_not_a_bullet_at_list_start ----
Test == /\ /\
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Encountered "====" at line 9, column 1 and token "/\\" 
    | Residual stack trace follows:
    | Expression starting at line 9, column 1.
    | Junction Item starting at line 8, column 12.
    | AND-OR Junction starting at line 8, column 12.
    | ExtendableExpr starting at line 8, column 12.
    | Expression starting at line 8, column 12.
    | Fatal errors while parsing TLA+ spec in file lor_is_not_a_bullet_at_list_start
    | In module lor_is_not_a_bullet_at_list_start
    | Could not parse module lor_is_not_a_bullet_at_list_start from file lor_is_not_a_bullet_at_list_start.tla
    | *** Errors: 1
    | In module lor_is_not_a_bullet_at_list_start
    | Could not parse module lor_is_not_a_bullet_at_list_start from file lor_is_not_a_bullet_at_list_start.tla
    3002:1 Parsing or semantic analysis failed.
---*)
