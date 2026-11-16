(*---
description: Evaluates a random int expression, seed 262, number 2155.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02155 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(IF ([SelectSeq([a |-> 1, b |-> TRUE], LAMBDA e : e > 0) EXCEPT ![1] = (-2147483647)] = (CHOOSE f \in [{1} -> 2..1] : TRUE)) THEN ((CHOOSE r \in [a : {0} \cup {1}] : TRUE)).a ELSE (LET b3404 == (7 * -1) IN {b3405 \in {x \in 1..3 : x > 1} : TRUE} % ((<<>>).a + (2147483647 + 7))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 212 to line 14, col 212 of module random_02155 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 210.
    | Expression starting at line 14, column 210.
    | ExtendableExpr starting at line 14, column 209.
    | Expression starting at line 14, column 209.
    | Definition starting at line 14, column 200.
    | Fatal errors while parsing TLA+ spec in file random_02155
    | In module random_02155
    | Could not parse module random_02155 from file random_02155.tla
    | *** Errors: 1
    | In module random_02155
    | Could not parse module random_02155 from file random_02155.tla
    3002:1 Parsing or semantic analysis failed.
---*)
