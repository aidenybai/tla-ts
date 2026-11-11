(*---
description: Evaluates a random function expression, seed 262, number 1927.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01927 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{1} -> {1, 2} \ {1}] : TRUE) EXCEPT ![IF (~(-1 = 2)) THEN ((1 \div -1) \div LET b3030 == 3 IN 3) ELSE Cardinality((CHOOSE r \in [a : 1..2] : TRUE))] = (CHOOSE b3031 \in {(0 % 2), (<<5, 6>>)[1]} : (~(FALSE => TRUE)))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 94 to line 14, col 97 of module random_01927 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 92.
    | Expression starting at line 14, column 92.
    | ExtendableExpr starting at line 14, column 91.
    | Expression starting at line 14, column 91.
    | ExtendableExpr starting at line 14, column 90.
    | Fatal errors while parsing TLA+ spec in file random_01927
    | In module random_01927
    | Could not parse module random_01927 from file random_01927.tla
    | *** Errors: 1
    | In module random_01927
    | Could not parse module random_01927 from file random_01927.tla
    3002:1 Parsing or semantic analysis failed.
---*)
