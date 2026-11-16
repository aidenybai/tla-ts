(*---
description: Evaluates a random record expression, seed 262, number 2017.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02017 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([[a |-> (CHOOSE b3196 \in ({2, 1, 3} \ {1}) : ({1} \subseteq [a |-> 1, b |-> TRUE])), b |-> ((CHOOSE b3197 \in 2..1 : FALSE) < (2147483647 * -1))] EXCEPT !.a = @ + ((CHOOSE b3198 \in {b3199 \in <<3, 1, 2>> : FALSE} : (b3198 < b3198)) + ((3)[2] \div Len(<<>>)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 155 to line 14, col 155 of module random_02017 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 144.
    | Expression starting at line 14, column 144.
    | ExtendableExpr starting at line 14, column 143.
    | ExtendableExpr starting at line 14, column 109.
    | Expression starting at line 14, column 109.
    | Fatal errors while parsing TLA+ spec in file random_02017
    | In module random_02017
    | Could not parse module random_02017 from file random_02017.tla
    | *** Errors: 1
    | In module random_02017
    | Could not parse module random_02017 from file random_02017.tla
    3002:1 Parsing or semantic analysis failed.
---*)
