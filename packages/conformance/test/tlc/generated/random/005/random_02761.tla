(*---
description: Evaluates a random set expression, seed 262, number 2761.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02761 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b4353 \in (([[a |-> 1] EXCEPT !.a = @ + -1]).a .. IF (FALSE /\ TRUE) THEN (0 * -1) ELSE (CHOOSE b4354 \in SUBSET {1} : FALSE)) : (\A b4355 \in {Head(<<>>) : b4356 \in UNION {{x \in 1..3 : x > 1}, Nat}} : ((~TRUE) <=> (TRUE => FALSE)))})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 94 to line 14, col 94 of module random_02761 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 92.
    | Expression starting at line 14, column 92.
    | ExtendableExpr starting at line 14, column 91.
    | Expression starting at line 14, column 91.
    | IF THEN ELSE starting at line 14, column 67.
    | Fatal errors while parsing TLA+ spec in file random_02761
    | In module random_02761
    | Could not parse module random_02761 from file random_02761.tla
    | *** Errors: 1
    | In module random_02761
    | Could not parse module random_02761 from file random_02761.tla
    3002:1 Parsing or semantic analysis failed.
---*)
