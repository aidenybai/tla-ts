(*---
description: tlapm's own test fast/regression/MiniProducerConsumer_test.tla, which checks stderr BEGIN.
ref: test/fast/regression/MiniProducerConsumer_test.tla
features:
  - tlapm-test
mode: proof
outcome: failed
---*)
------------------------ MODULE MiniProducerConsumer_test -------------------
EXTENDS Integers, Sequences, TLAPS
VARIABLES in, out, buf
CONSTANT N, Msg, Input
vars == << in, out, buf >>

ISeq(S) == [(Nat \ {0}) -> S]

ITail(iseq) == [i \in (Nat \ {0}) |-> iseq[i+1]]

IHead(iseq) == iseq[1]

seq ** iseq == [i \in (Nat \ {0}) |->
                  IF i =< Len(seq) THEN seq[i]
                                   ELSE iseq[i - Len(seq)]]

LEMMA IDistr == ASSUME NEW S, NEW s \in Seq(S), NEW t \in Seq(S), NEW u \in ISeq(S)
                PROVE  (s \o t) ** u = s ** (t ** u)
 BY DEF ISeq, **

LEMMA HeadTail == ASSUME NEW S,
                         NEW s \in Seq(S), NEW t \in Seq(S),
                         Len(t) # 0
                  PROVE s \o t = Append(s, Head(t)) \o Tail(t)
OBVIOUS



LEMMA IHeadTail == ASSUME NEW S,
                         NEW s \in Seq(S), NEW t \in ISeq(S)
                  PROVE
                  s ** t = Append(s, IHead(t)) ** ITail(t)
BY DEF IHead, ISeq, ITail, **

AXIOM Assump == /\ N \in Nat \ {0}
                /\ Input \in ISeq(Msg)


Init == (* Global variables *)
        /\ in = Input
        /\ out = << >>
        /\ buf = << >>

Producer == /\ Len(buf) # N
            /\ buf' = Append(buf, IHead(in))
            /\ in' = ITail (in)
            /\ out' = out

Consumer == /\ Len(buf) # 0
            /\ out' = Append(out, Head(buf))
            /\ buf' = Tail (buf)
            /\ in' = in

Next == Producer \/ Consumer

Spec == /\ Init /\ [][Next]_vars
        /\ WF_vars(Producer)
        /\ WF_vars(Consumer)

ProcSet == {0} \cup {1}

TypeOK == /\ in \in ISeq(Msg)
          /\ out \in Seq(Msg)
          /\ buf \in Seq(Msg)

Inv == /\ TypeOK
       /\ (Len(buf) =< N)
       /\ (Input = (out \o buf) ** in)

THEOREM Spec BY PTL

=============================================================================

(*--- recorded
all:
  exit: 10
  transcript: |-
    @type: obligation
    @id: 1
    @loc: 27:2:27:4
    @status: to be proved

    @type: obligation
    @id: 1
    @loc: 27:2:27:4
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 2
    @loc: 33:1:33:8
    @status: to be proved

    @type: obligation
    @id: 2
    @loc: 33:1:33:8
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 3
    @loc: 41:1:41:3
    @status: to be proved

    @type: obligation
    @id: 3
    @loc: 41:1:41:3
    @status: proved
    @prover: smt
    @meth: time-limit: 5
    @already: false

    @type: obligation
    @id: 4
    @loc: 78:14:78:16
    @status: to be proved

    @type: obligation
    @id: 4
    @loc: 78:14:78:16
    @status: failed
    @prover: ls4
    @meth: time-limit: 10
    @reason: false
    @already: false
    @obl: 
    ASSUME NEW VARIABLE in,
           NEW VARIABLE out,
           NEW VARIABLE buf,
           NEW CONSTANT N,
           NEW CONSTANT Msg,
           NEW CONSTANT Input,
           TRUE 
    PROVE  Spec

    @type: obligation
    @id: 5
    @loc: 78:17:78:20
    @status: to be proved

    @type: obligation
    @id: 5
    @loc: 78:17:78:20
    @status: trivial
    @prover: tlapm
    @already: false

    @type: obligationsnumber
    @count: 5

    File "./MiniProducerConsumer_test.tla", line 78, characters 14-15:
    [ERROR]: Could not prove or check:
               ASSUME NEW VARIABLE in,
                      NEW VARIABLE out,
                      NEW VARIABLE buf,
                      NEW CONSTANT N,
                      NEW CONSTANT Msg,
                      NEW CONSTANT Input,
                      Assump == /\ N \in Nat \ {0}
                                /\ Input \in ISeq(Msg),
                      PTL 
               PROVE  Spec
    File "./MiniProducerConsumer_test.tla", line 9, character 1 to line 80, character 77:
    [ERROR]: 1/5 obligations failed.
    There were backend errors processing module `"MiniProducerConsumer_test"`.
---*)
