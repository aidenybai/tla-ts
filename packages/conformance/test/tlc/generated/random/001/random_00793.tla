(*---
description: Evaluates a random function expression, seed 262, number 793.
ref: tlc2/tool/impl/Tool.java#evalImpl
features:
  - random-expression
flags:
  - expression
contexts:
  - assume
outcome: any
---*)
---- MODULE random_00793 ----
EXTENDS Integers, Sequences, FiniteSets, Bags, TLC
Test == PrintT([(CHOOSE f \in [{} -> {0} \cup {1}] : TRUE) EXCEPT ![((CASE TRUE -> 0 [] OTHER -> -1 - Cardinality({1})) % {LET b1305 == <<1, 2>> IN 0 : b1304 \in (<<3, 1, 2>> .. 1)})] = Head(<<(0 % -1), (<<>> \div -1)>>)])
====

(*--- recorded
all:
  exit: 150
  transcript: |-
    | ***Parse Error***
    |   Precedence conflict between ops \div in block line 14, col 210 to line 14, col 213 of module random_00793 and -..
    | Residual stack trace follows:
    | ExtendableExpr starting at line 14, column 205.
    | Expression starting at line 14, column 205.
    | ExtendableExpr starting at line 14, column 204.
    | Expression starting at line 14, column 204.
    | Some << -- >> or >>_ Form starting at line 14, column 192.
    | Fatal errors while parsing TLA+ spec in file random_00793
    | In module random_00793
    | Could not parse module random_00793 from file random_00793.tla
    | *** Errors: 1
    | In module random_00793
    | Could not parse module random_00793 from file random_00793.tla
    3002:1 Parsing or semantic analysis failed.
---*)
