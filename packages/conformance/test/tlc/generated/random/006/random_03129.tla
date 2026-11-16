(*---
description: Evaluates a random bool expression, seed 262, number 3129.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03129 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((((1..3 \cup {1, 2}) \ {b5000 \in {x \in 1..3 : x > 1} : FALSE}) \cup {(SUBSET {1} + b5001) : b5001 \in DOMAIN [a |-> 1, b |-> TRUE]}) = (((2147483647 .. 2147483647) \cap (1..3 \ 1..3)) \cap ((1..3 \cap 1..3) \cup (3 :> [a |-> 1, b |-> TRUE])))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops SUBSET in block line 14, col 89 to line 14, col 94 of module random_03129 and +.
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 96.
    | Expression starting at line 14, column 89.
    | ExtendableExpr starting at line 14, column 88.
    | Expression starting at line 14, column 88.
    | Some { } form starting at line 14, column 87.
    | Fatal errors while parsing TLA+ spec in file random_03129
    | In module random_03129
    | Could not parse module random_03129 from file random_03129.tla
    | *** Errors: 1
    | In module random_03129
    | Could not parse module random_03129 from file random_03129.tla
    3002:1 Parsing or semantic analysis failed.
---*)
