(*---
description: Evaluates a random function expression, seed 262, number 1091.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_01091 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([b1739 \in (LET b1740 == CASE TRUE -> 2147483647 [] OTHER -> 3 IN Cardinality(2..1) .. (Head(<<>>) * ([a |-> 1])[2])) |-> LET b1741 == LET b1742 == CASE [a |-> 1, b |-> TRUE] -> b1739 [] OTHER -> [a |-> 1] IN (b1739 * -1) IN (IF FALSE THEN b1739 ELSE b1739 \div (3 \div b1741))])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 232 to line 14, col 232 of module random_01091 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 226.
    | Expression starting at line 14, column 226.
    | ExtendableExpr starting at line 14, column 225.
    | Expression starting at line 14, column 225.
    | Case Other Arm starting at line 14, column 151.
    | Fatal errors while parsing TLA+ spec in file random_01091
    | In module random_01091
    | Could not parse module random_01091 from file random_01091.tla
    | *** Errors: 1
    | In module random_01091
    | Could not parse module random_01091 from file random_01091.tla
    3002:1 Parsing or semantic analysis failed.
---*)
