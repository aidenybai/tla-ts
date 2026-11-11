(*---
description: A parenthesized left side of an infix is not a definition form.
ref: "tla2sany/parser/TLAplusParser.java#InfixLHS"
features: [operators]
outcome: parse-error
---*)
---- MODULE define_infix_with_parens ----
(a ++ b) == 1
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    | Was expecting "LOCAL, INSTANCE, PROOF, ASSUMPTION, THEOREM, RECURSIVE, declaration, or definition"
    | Encountered "Beginning of definition (" at line 8, column 1 and token "----" 
    | Residual stack trace follows:
    | Module body starting at line 8, column 1.
    | Module definition starting at line 7, column 1.
    | Fatal errors while parsing TLA+ spec in file define_infix_with_parens
    | In module define_infix_with_parens
    | Could not parse module define_infix_with_parens from file define_infix_with_parens.tla
    | *** Errors: 1
    | In module define_infix_with_parens
    | Could not parse module define_infix_with_parens from file define_infix_with_parens.tla
    3002:1 Parsing or semantic analysis failed.
---*)
