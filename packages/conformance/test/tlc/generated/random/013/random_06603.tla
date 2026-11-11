(*---
description: Evaluates a random function expression, seed 262, number 6603.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06603 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((CHOOSE f \in [{1, 2} \cap {2} -> {}] : TRUE) @@ [[b10132 \in DOMAIN [x \in Nat |-> x + 1] |-> (b10132 + 2147483647)] EXCEPT ![IF ({2, 1, 3} = 1..3) THEN (1 * -1) ELSE ([x \in 1..2 |-> x])[2]] = ((0 \div [x \in 1..2 |-> x]) - Head(<<3, 1, 2>>))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 174 to line 14, col 174 of module random_06603 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 172.
    | Expression starting at line 14, column 172.
    | ExtendableExpr starting at line 14, column 171.
    | Expression starting at line 14, column 171.
    | IF THEN ELSE starting at line 14, column 144.
    | Fatal errors while parsing TLA+ spec in file random_06603
    | In module random_06603
    | Could not parse module random_06603 from file random_06603.tla
    | *** Errors: 1
    | In module random_06603
    | Could not parse module random_06603 from file random_06603.tla
    3002:1 Parsing or semantic analysis failed.
---*)
