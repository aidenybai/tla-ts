(*---
description: Evaluates a random function expression, seed 262, number 2618.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_02618 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT(((SubSeq(<<1, 1>>, [<<1, 2>> EXCEPT ![1] = 7], LET b4123 == 2147483647 IN b4123) = ((3 + -1) :> Head(<<>>))) => ((CHOOSE b4124 \in (7 * -1) : ({1, 2} = {})) < (LET b4125 == -1 IN b4125 \div (1 % 7)))))
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops * in block line 14, col 150 to line 14, col 150 of module random_02618 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 148.
    | Expression starting at line 14, column 148.
    | ExtendableExpr starting at line 14, column 147.
    | Expression starting at line 14, column 147.
    | Domain binding starting at line 14, column 143.
    | Fatal errors while parsing TLA+ spec in file random_02618
    | In module random_02618
    | Could not parse module random_02618 from file random_02618.tla
    | *** Errors: 1
    | In module random_02618
    | Could not parse module random_02618 from file random_02618.tla
    3002:1 Parsing or semantic analysis failed.
---*)
