(*---
description: Evaluates a random set expression, seed 262, number 9197.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09197 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT({(CASE (7 = 3) -> Cardinality(SUBSET {1}) [] OTHER -> (2147483647 \div -1) * Head((\E b14272 \in {1} : [x \in Nat |-> x + 1]))), (CHOOSE f \in [2..1 -> 2..1] : TRUE)})
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 82 to line 14, col 85 of module random_09197 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 71.
    | Expression starting at line 14, column 71.
    | ExtendableExpr starting at line 14, column 70.
    | Expression starting at line 14, column 70.
    | Case Other Arm starting at line 14, column 61.
    | Fatal errors while parsing TLA+ spec in file random_09197
    | In module random_09197
    | Could not parse module random_09197 from file random_09197.tla
    | *** Errors: 1
    | In module random_09197
    | Could not parse module random_09197 from file random_09197.tla
    3002:1 Parsing or semantic analysis failed.
---*)
