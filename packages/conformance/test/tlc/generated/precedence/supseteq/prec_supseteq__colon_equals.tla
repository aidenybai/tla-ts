(*---
description: Groups \supseteq against :=, or rejects them as conflicting.
ref: tla2sany/parser/Operators.java; Specifying Systems 15.2.1
features:
  - operator-precedence
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE prec_supseteq__colon_equals ----
EXTENDS TLC
a \supseteq b == <<"\\supseteq", a, b>>
a := b == <<":=", a, b>>
Test == PrintT(1 \supseteq 2 := 3)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \supseteq in block line 16, col 18 to line 16, col 26 of module prec_supseteq__colon_equals and :=.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 16, column 28.
    | ExtendableExpr starting at line 16, column 16.
    | Expression starting at line 16, column 16.
    | Optional Arguments starting at line 16, column 15.
    | Primitive expression starting at line 16, column 9.
    | Fatal errors while parsing TLA+ spec in file prec_supseteq__colon_equals
    | In module prec_supseteq__colon_equals
    | Could not parse module prec_supseteq__colon_equals from file prec_supseteq__colon_equals.tla
    | *** Errors: 1
    | In module prec_supseteq__colon_equals
    | Could not parse module prec_supseteq__colon_equals from file prec_supseteq__colon_equals.tla
    3002:1 Parsing or semantic analysis failed.
---*)
