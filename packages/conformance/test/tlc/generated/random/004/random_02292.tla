(*---
description: Evaluates a random bool expression, seed 262, number 2292.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02292 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT((\A b3618 \in {CASE (2147483647 < 3) -> (2 \div -1) [] OTHER -> (-1 % 2), Head((SUBSET {1} \ {1}))} : (\E b3619 \in (({1, 2} \cup {1, 2}) \cup (-1 \in <<3, 1, 2>>)) : ((FALSE <=> FALSE) <=> (TRUE => FALSE)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 59 to line 14, col 62 of module random_02292 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 57.
    | Expression starting at line 14, column 57.
    | ExtendableExpr starting at line 14, column 56.
    | Expression starting at line 14, column 56.
    | Case Arm starting at line 14, column 36.
    | Fatal errors while parsing TLA+ spec in file random_02292
    | In module random_02292
    | Could not parse module random_02292 from file random_02292.tla
    | *** Errors: 1
    | In module random_02292
    | Could not parse module random_02292 from file random_02292.tla
    3002:1 Parsing or semantic analysis failed.
---*)
