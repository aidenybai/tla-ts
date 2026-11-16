(*---
description: Evaluates a random seq expression, seed 262, number 4142.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_04142 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(<<CASE ({3 : b6525 \in Nat} = {-1, -1}) -> ((-1 % 2) - Len(<<3, 1, 2>>)) [] OTHER -> (Len(<<1>>) + (3 - 1)), (CASE (2147483647 \in {1}) -> IF FALSE THEN FALSE ELSE 0 [] OTHER -> (-2147483647) - ((3 * -1) * Len(<<>>)))>>)
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 214 to line 14, col 214 of module random_04142 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 212.
    | Expression starting at line 14, column 212.
    | ExtendableExpr starting at line 14, column 211.
    | Expression starting at line 14, column 211.
    | ExtendableExpr starting at line 14, column 210.
    | Fatal errors while parsing TLA+ spec in file random_04142
    | In module random_04142
    | Could not parse module random_04142 from file random_04142.tla
    | *** Errors: 1
    | In module random_04142
    | Could not parse module random_04142 from file random_04142.tla
    3002:1 Parsing or semantic analysis failed.
---*)
