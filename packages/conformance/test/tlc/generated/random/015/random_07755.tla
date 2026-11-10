(*---
description: Evaluates a random int expression, seed 262, number 7755.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_07755 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([b11961 \in (Head(<<3, 1, 2>>) .. (0 * -1)) |-> IF (\A b11962 \in <<1>> : TRUE) THEN ([a |-> 1]).a ELSE (b11961 + 0)])[(([(1 :> 2) EXCEPT ![3] = 0])[(CHOOSE b11963 \in {1} : FALSE)] \div <<(CHOOSE b11964 \in {1} : FALSE), (3 % [a |-> 1, b |-> TRUE])>>)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 54 to line 14, col 54 of module random_07755 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 52.
    | Expression starting at line 14, column 52.
    | ExtendableExpr starting at line 14, column 51.
    | ExtendableExpr starting at line 14, column 30.
    | Expression starting at line 14, column 30.
    | Fatal errors while parsing TLA+ spec in file random_07755
    | In module random_07755
    | Could not parse module random_07755 from file random_07755.tla
    | *** Errors: 1
    | In module random_07755
    | Could not parse module random_07755 from file random_07755.tla
    3002:1 Parsing or semantic analysis failed.
---*)
