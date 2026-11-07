(*---
description: Evaluates a random set expression, seed 262, number 3744.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03744 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({b5907 \in (({-1, 3} \cup {-1, 2147483647}) \cup UNION {{b5908 \in 2..1 : FALSE}, {b5909 \in {2, 1, 3} : TRUE}}) : IF ((1..3 \ {1}) = (b5907 \in [a |-> 1, b |-> TRUE])) THEN (-(7 * -1)) ELSE IF (3 :> 2) THEN (b5907 + b5907) ELSE (b5907 \div 1)})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 195 to line 14, col 195 of module random_03744 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 193.
    | Expression starting at line 14, column 193.
    | ExtendableExpr starting at line 14, column 192.
    | Expression starting at line 14, column 191.
    | ExtendableExpr starting at line 14, column 190.
    | Fatal errors while parsing TLA+ spec in file random_03744
    | In module random_03744
    | Could not parse module random_03744 from file random_03744.tla
    | *** Errors: 1
    | In module random_03744
    | Could not parse module random_03744 from file random_03744.tla
    3002:1 Parsing or semantic analysis failed.
---*)
