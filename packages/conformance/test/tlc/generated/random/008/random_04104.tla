(*---
description: Evaluates a random function expression, seed 262, number 4104.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04104 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b6448 \in (UNION {{b6449 \in {2, 1, 3} : FALSE}, (2..1 \ {x \in 1..3 : x > 1})} \cup (LET b6450 == -1 IN {2, 1, 3} .. Len(<<3, 1, 2>>))) |-> (-CASE (~TRUE) -> (2147483647 + 7) [] OTHER -> (b6448 \div -1))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 212 to line 14, col 215 of module random_04104 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 206.
    | Expression starting at line 14, column 206.
    | ExtendableExpr starting at line 14, column 205.
    | Expression starting at line 14, column 205.
    | Case Other Arm starting at line 14, column 196.
    | Fatal errors while parsing TLA+ spec in file random_04104
    | In module random_04104
    | Could not parse module random_04104 from file random_04104.tla
    | *** Errors: 1
    | In module random_04104
    | Could not parse module random_04104 from file random_04104.tla
    3002:1 Parsing or semantic analysis failed.
---*)
