(*---
description: Groups ^^ against ^^, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_caret_caret__caret_caret ----
EXTENDS TLC
a ^^ b == <<"^^", a, b>>
Test == PrintT(1 ^^ 2 ^^ 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops ^^ in block line 15, col 18 to line 15, col 19 of module prec_caret_caret__caret_caret and ^^.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 15, column 21.
    | ExtendableExpr starting at line 15, column 16.
    | Expression starting at line 15, column 16.
    | Optional Arguments starting at line 15, column 15.
    | Primitive expression starting at line 15, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_caret_caret__caret_caret
    | In module prec_caret_caret__caret_caret
    | Could not parse module prec_caret_caret__caret_caret from file prec_caret_caret__caret_caret.tla
    | *** Errors: 1
    | In module prec_caret_caret__caret_caret
    | Could not parse module prec_caret_caret__caret_caret from file prec_caret_caret__caret_caret.tla
    3002:1 Parsing or semantic analysis failed.
---*)
