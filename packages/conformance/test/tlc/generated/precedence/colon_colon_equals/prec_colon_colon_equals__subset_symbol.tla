(*---
description: Groups ::= against \subset, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_colon_colon_equals__subset_symbol ----
EXTENDS TLC
a ::= b == <<"::=", a, b>>
a \subset b == <<"\\subset", a, b>>
Test == PrintT(1 ::= 2 \subset 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops ::= in block line 16, col 18 to line 16, col 20 of module prec_colon_colon_equals__subset_symbol and \subset.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 22.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_colon_colon_equals__subset_symbol
    | In module prec_colon_colon_equals__subset_symbol
    | Could not parse module prec_colon_colon_equals__subset_symbol from file prec_colon_colon_equals__subset_symbol.tla
    | *** Errors: 1
    | In module prec_colon_colon_equals__subset_symbol
    | Could not parse module prec_colon_colon_equals__subset_symbol from file prec_colon_colon_equals__subset_symbol.tla
    3002:1 Parsing or semantic analysis failed.
---*)
