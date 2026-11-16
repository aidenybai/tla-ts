(*---
description: Evaluates a random record expression, seed 262, number 3027.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03027 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[[[a |-> -1, b |-> 0] EXCEPT !.a = @ + CASE FALSE -> 0 [] OTHER -> 0] EXCEPT !.a = @ + Len((<<>> \o <<1, 2>>))] EXCEPT !.a = @ + (Len((<<1>> \o <<>>)) - (Len(<<1>>) + (SUBSET {1} % 0)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops SUBSET in block line 14, col 185 to line 14, col 190 of module random_03027 and %.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 192.
    | Expression starting at line 14, column 185.
    | ExtendableExpr starting at line 14, column 184.
    | ExtendableExpr starting at line 14, column 171.
    | Expression starting at line 14, column 171.
    | Fatal errors while parsing TLA+ spec in file random_03027
    | In module random_03027
    | Could not parse module random_03027 from file random_03027.tla
    | *** Errors: 1
    | In module random_03027
    | Could not parse module random_03027 from file random_03027.tla
    3002:1 Parsing or semantic analysis failed.
---*)
