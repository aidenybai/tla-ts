(*---
description: Evaluates a random seq expression, seed 262, number 3829.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_03829 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(SubSeq(SubSeq(([FALSE EXCEPT ![1] = 0] \o (<<1, 2>> \o <<3, 1, 2>>)), Head(Append(<<3, 1, 2>>, -1)), Len(<<-1, 3>>)), CASE ((0 + -1) = CASE TRUE -> 7 [] OTHER -> 0) -> LET b6036 == Cardinality({}) IN (0 \div -1) [] OTHER -> ((-0) \div Cardinality(Nat)), ([(CHOOSE f \in [{1, 2} -> {1}] : TRUE) EXCEPT ![Len(<<1, 2>>)] = (2147483647 \div 2147483647)])[((1 * 3) \div (0 \div -1))]))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 219 to line 14, col 222 of module random_03829 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 217.
    | Expression starting at line 14, column 217.
    | ExtendableExpr starting at line 14, column 216.
    | Expression starting at line 14, column 216.
    | Case Other Arm starting at line 14, column 184.
    | Fatal errors while parsing TLA+ spec in file random_03829
    | In module random_03829
    | Could not parse module random_03829 from file random_03829.tla
    | *** Errors: 1
    | In module random_03829
    | Could not parse module random_03829 from file random_03829.tla
    3002:1 Parsing or semantic analysis failed.
---*)
