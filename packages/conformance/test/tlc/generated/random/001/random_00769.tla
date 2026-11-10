(*---
description: Evaluates a random int expression, seed 262, number 769.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00769 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(Append(SubSeq(<<(0 - 0), (2147483647 * 1)>>, ((2147483647 * -1) % (7 * 0)), CASE (<<1>> = [a |-> 1]) -> IF TRUE THEN -1 ELSE 0 [] OTHER -> ([a |-> 1]).a), Cardinality(((-2) \div (0 \div 0)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 74 to line 14, col 74 of module random_00769 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 63.
    | Expression starting at line 14, column 63.
    | ExtendableExpr starting at line 14, column 62.
    | Expression starting at line 14, column 62.
    | ExtendableExpr starting at line 14, column 61.
    | Fatal errors while parsing TLA+ spec in file random_00769
    | In module random_00769
    | Could not parse module random_00769 from file random_00769.tla
    | *** Errors: 1
    | In module random_00769
    | Could not parse module random_00769 from file random_00769.tla
    3002:1 Parsing or semantic analysis failed.
---*)
