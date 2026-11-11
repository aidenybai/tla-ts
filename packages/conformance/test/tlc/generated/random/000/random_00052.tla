(*---
description: Evaluates a random set expression, seed 262, number 52.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00052 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((-((3 % 1) * ([a |-> 1, b |-> TRUE]).a)) .. ((CHOOSE b75 \in (SUBSET {1} \cup Nat) : (<<3, 1, 2>> = <<5, 6>>)) * LET b76 == (-2147483647) IN (2147483647 * -1))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 170 to line 14, col 170 of module random_00052 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 159.
    | Expression starting at line 14, column 159.
    | ExtendableExpr starting at line 14, column 158.
    | Expression starting at line 14, column 158.
    | Case Other Arm starting at line 14, column 130.
    | Fatal errors while parsing TLA+ spec in file random_00052
    | In module random_00052
    | Could not parse module random_00052 from file random_00052.tla
    | *** Errors: 1
    | In module random_00052
    | Could not parse module random_00052 from file random_00052.tla
    3002:1 Parsing or semantic analysis failed.
---*)
