(*---
description: Evaluates a random bool expression, seed 262, number 6180.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_06180 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((UNION {((SUBSET {1} \cap {1, 2}) \cap {b9508 : b9508 \in 2..1}), {b9509 \in {b9510 \in <<1, 2>> : TRUE} : (2 = b9509)}} = (((2147483647 - 3) + (2147483647 \div -1)) .. ((7 - 3) % (0 % 2147483647)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 172 to line 14, col 175 of module random_06180 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 161.
    | Expression starting at line 14, column 161.
    | ExtendableExpr starting at line 14, column 160.
    | ExtendableExpr starting at line 14, column 141.
    | Expression starting at line 14, column 141.
    | Fatal errors while parsing TLA+ spec in file random_06180
    | In module random_06180
    | Could not parse module random_06180 from file random_06180.tla
    | *** Errors: 1
    | In module random_06180
    | Could not parse module random_06180 from file random_06180.tla
    3002:1 Parsing or semantic analysis failed.
---*)
