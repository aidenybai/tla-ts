(*---
description: Evaluates a random function expression, seed 262, number 9051.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_09051 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(([(CHOOSE f \in [1..2 -> {}] : TRUE) EXCEPT ![CASE (<<>> = <<1>>) -> (2147483647 - 1) [] OTHER -> ([a |-> 1, b |-> TRUE]).a] = ((0 \div 0) - (2147483647 \div -1))] @@ (LET b14065 == Len(<<>>) IN (b14065 + b14065) :> (CHOOSE b14066 \in ({1} \ SUBSET {1}) : [<<5, 6>> EXCEPT ![3] = b14066]))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 169 to line 14, col 172 of module random_09051 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 158.
    | Expression starting at line 14, column 158.
    | ExtendableExpr starting at line 14, column 157.
    | ExtendableExpr starting at line 14, column 144.
    | Expression starting at line 14, column 144.
    | Fatal errors while parsing TLA+ spec in file random_09051
    | In module random_09051
    | Could not parse module random_09051 from file random_09051.tla
    | *** Errors: 1
    | In module random_09051
    | Could not parse module random_09051 from file random_09051.tla
    3002:1 Parsing or semantic analysis failed.
---*)
