(*---
description: Ported from TLC's ExamplesACPNBTLCTest.
source: tlatools/org.lamport.tlatools/test/tlc2/tool/liveness/ExamplesACPNBTLCTest.java
features:
  - tlc-regression
outcome: liveness-violation
config: |-
  \* TLC configuration file for ACP_NB
  \* Safety has been checked for 3 participants (without symmetries) 
  \* and 4 participants (with symmetries)
  \* Liveness has been checked for 3 participants
  \* Incorrect safety and liveness properties are both detected
  \* (with meaningful counterexamples) with 2 participants

  \*SYMMETRY
  \*  Perms

  CONSTANTS
    p0 = p0
    p1 = p1
    participants = { p0, p1 }

    waiting = waiting
    notsent = notsent
    undecided = undecided
    commit = commit
    abort = abort
    yes = yes
    no = no

  SPECIFICATION
    SpecNB
    
  PROPERTIES
    AC1 AC2 AC3_1 AC4_alt            \* safety
    AC3_2 AC5                        \* liveness

  PROPERTY AllMustCommit

  \*  DecisionReachedNoFault         \* invalid, to check that TLC does its job
  \*  AbortImpliesNoVote             \* invalid, to check that TLC does its job
  \*  StrongerAC3_1                  \* invalid, to check that TLC does its job
  \*  AllCommit                      \* invalid, to check that TLC does its job
  \*  AllAbort                       \* invalid, to check that TLC does its job

  CHECK_DEADLOCK FALSE

  POSTCONDITION PostCondition
args:
  - -lncheck
  - final
  - -deadlock
includes:
  - ACP_NB.tla
  - ACP_SB.tla
---*)
------------------------------ MODULE ACP_NB_TLC -------------------------------

\* ACP_SB, TLC ready

EXTENDS ACP_NB, TLC, TLCExt

Perms == Permutations(participants) \* to benefit from symmetries

--------------------------------------------------------------------------------

\* AC4 rewritten in a way that is better handled by TLC

AC4_alt == [][ /\ (\A i \in participants : participant[i].decision = commit 
                                => (participant'[i].decision = commit))
               /\ (\A j \in participants : participant[j].decision = abort  
                                => (participant'[j].decision = abort))]_<<participant>>

AllMustCommit == \A p \in participants : <>(participant[p].decision = commit)

CONSTANTS p0, p1

PostCondition ==
   CounterExample = 
    [ action |->
      { << << 1,
              [ participant |->
                    ( p0 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                      p1 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
                coordinator |->
                    [ decision |-> undecided,
                      vote |-> (p0 :> waiting @@ p1 :> waiting),
                      alive |-> TRUE,
                      faulty |-> FALSE,
                      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                      request |-> (p0 :> FALSE @@ p1 :> FALSE) ] ] >>,
           [ name |-> "request",
             location |->
                 [ beginLine |-> 100,
                   beginColumn |-> 15,
                   endLine |-> 105,
                   endColumn |-> 41,
                   module |-> "ACP_SB" ],
             context |-> [i |-> p0],
             parameters |-> <<"i">> ],
           << 2,
              [ participant |->
                    ( p0 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                      p1 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
                coordinator |->
                    [ decision |-> undecided,
                      vote |-> (p0 :> waiting @@ p1 :> waiting),
                      alive |-> TRUE,
                      faulty |-> FALSE,
                      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                      request |-> (p0 :> TRUE @@ p1 :> FALSE) ] ] >> >>,
        << << 2,
              [ participant |->
                    ( p0 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                      p1 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
                coordinator |->
                    [ decision |-> undecided,
                      vote |-> (p0 :> waiting @@ p1 :> waiting),
                      alive |-> TRUE,
                      faulty |-> FALSE,
                      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                      request |-> (p0 :> TRUE @@ p1 :> FALSE) ] ] >>,
           [ name |-> "sendVote",
             location |->
                 [ beginLine |-> 211,
                   beginColumn |-> 16,
                   endLine |-> 216,
                   endColumn |-> 42,
                   module |-> "ACP_SB" ],
             context |-> [i |-> p0],
             parameters |-> <<"i">> ],
           << 3,
              [ participant |->
                    ( p0 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> TRUE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                      p1 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
                coordinator |->
                    [ decision |-> undecided,
                      vote |-> (p0 :> waiting @@ p1 :> waiting),
                      alive |-> TRUE,
                      faulty |-> FALSE,
                      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                      request |-> (p0 :> TRUE @@ p1 :> FALSE) ] ] >> >>,
        << << 3,
              [ participant |->
                    ( p0 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> TRUE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                      p1 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
                coordinator |->
                    [ decision |-> undecided,
                      vote |-> (p0 :> waiting @@ p1 :> waiting),
                      alive |-> TRUE,
                      faulty |-> FALSE,
                      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                      request |-> (p0 :> TRUE @@ p1 :> FALSE) ] ] >>,
           [ name |-> "request",
             location |->
                 [ beginLine |-> 100,
                   beginColumn |-> 15,
                   endLine |-> 105,
                   endColumn |-> 41,
                   module |-> "ACP_SB" ],
             context |-> [i |-> p1],
             parameters |-> <<"i">> ],
           << 4,
              [ participant |->
                    ( p0 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> TRUE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                      p1 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
                coordinator |->
                    [ decision |-> undecided,
                      vote |-> (p0 :> waiting @@ p1 :> waiting),
                      alive |-> TRUE,
                      faulty |-> FALSE,
                      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                      request |-> (p0 :> TRUE @@ p1 :> TRUE) ] ] >> >>,
        << << 4,
              [ participant |->
                    ( p0 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> TRUE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                      p1 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
                coordinator |->
                    [ decision |-> undecided,
                      vote |-> (p0 :> waiting @@ p1 :> waiting),
                      alive |-> TRUE,
                      faulty |-> FALSE,
                      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                      request |-> (p0 :> TRUE @@ p1 :> TRUE) ] ] >>,
           [ name |-> "getVote",
             location |->
                 [ beginLine |-> 118,
                   beginColumn |-> 15,
                   endLine |-> 126,
                   endColumn |-> 41,
                   module |-> "ACP_SB" ],
             context |-> [i |-> p0],
             parameters |-> <<"i">> ],
           << 5,
              [ participant |->
                    ( p0 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> TRUE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                      p1 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
                coordinator |->
                    [ decision |-> undecided,
                      vote |-> (p0 :> yes @@ p1 :> waiting),
                      alive |-> TRUE,
                      faulty |-> FALSE,
                      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                      request |-> (p0 :> TRUE @@ p1 :> TRUE) ] ] >> >>,
        << << 5,
              [ participant |->
                    ( p0 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> TRUE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                      p1 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
                coordinator |->
                    [ decision |-> undecided,
                      vote |-> (p0 :> yes @@ p1 :> waiting),
                      alive |-> TRUE,
                      faulty |-> FALSE,
                      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                      request |-> (p0 :> TRUE @@ p1 :> TRUE) ] ] >>,
           [ name |-> "coordDie",
             location |->
                 [ beginLine |-> 196,
                   beginColumn |-> 13,
                   endLine |-> 198,
                   endColumn |-> 39,
                   module |-> "ACP_SB" ] ],
           << 6,
              [ participant |->
                    ( p0 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> TRUE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                      p1 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
                coordinator |->
                    [ decision |-> undecided,
                      vote |-> (p0 :> yes @@ p1 :> waiting),
                      alive |-> FALSE,
                      faulty |-> TRUE,
                      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                      request |-> (p0 :> TRUE @@ p1 :> TRUE) ] ] >> >>,
        << << 6,
              [ participant |->
                    ( p0 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> TRUE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                      p1 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
                coordinator |->
                    [ decision |-> undecided,
                      vote |-> (p0 :> yes @@ p1 :> waiting),
                      alive |-> FALSE,
                      faulty |-> TRUE,
                      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                      request |-> (p0 :> TRUE @@ p1 :> TRUE) ] ] >>,
           [ name |-> "parDie",
             location |->
                 [ beginLine |-> 280,
                   beginColumn |-> 14,
                   endLine |-> 284,
                   endColumn |-> 40,
                   module |-> "ACP_SB" ],
             context |-> [i |-> p0],
             parameters |-> <<"i">> ],
           << 7,
              [ participant |->
                    ( p0 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> FALSE,
                            faulty |-> TRUE,
                            voteSent |-> TRUE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                      p1 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
                coordinator |->
                    [ decision |-> undecided,
                      vote |-> (p0 :> yes @@ p1 :> waiting),
                      alive |-> FALSE,
                      faulty |-> TRUE,
                      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                      request |-> (p0 :> TRUE @@ p1 :> TRUE) ] ] >> >>,
        << << 7,
              [ participant |->
                    ( p0 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> FALSE,
                            faulty |-> TRUE,
                            voteSent |-> TRUE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                      p1 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> TRUE,
                            faulty |-> FALSE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
                coordinator |->
                    [ decision |-> undecided,
                      vote |-> (p0 :> yes @@ p1 :> waiting),
                      alive |-> FALSE,
                      faulty |-> TRUE,
                      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                      request |-> (p0 :> TRUE @@ p1 :> TRUE) ] ] >>,
           [ name |-> "parDie",
             location |->
                 [ beginLine |-> 280,
                   beginColumn |-> 14,
                   endLine |-> 284,
                   endColumn |-> 40,
                   module |-> "ACP_SB" ],
             context |-> [i |-> p1],
             parameters |-> <<"i">> ],
           << 8,
              [ participant |->
                    ( p0 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> FALSE,
                            faulty |-> TRUE,
                            voteSent |-> TRUE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                      p1 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> FALSE,
                            faulty |-> TRUE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
                coordinator |->
                    [ decision |-> undecided,
                      vote |-> (p0 :> yes @@ p1 :> waiting),
                      alive |-> FALSE,
                      faulty |-> TRUE,
                      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                      request |-> (p0 :> TRUE @@ p1 :> TRUE) ] ] >> >>,
        << << 8,
              [ participant |->
                    ( p0 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> FALSE,
                            faulty |-> TRUE,
                            voteSent |-> TRUE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                      p1 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> FALSE,
                            faulty |-> TRUE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
                coordinator |->
                    [ decision |-> undecided,
                      vote |-> (p0 :> yes @@ p1 :> waiting),
                      alive |-> FALSE,
                      faulty |-> TRUE,
                      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                      request |-> (p0 :> TRUE @@ p1 :> TRUE) ] ] >>,
           [ name |-> "parDie",
             location |->
                 [ beginLine |-> 280,
                   beginColumn |-> 14,
                   endLine |-> 284,
                   endColumn |-> 40,
                   module |-> "ACP_SB" ],
             context |-> [i |-> p1],
             parameters |-> <<"i">> ],
           << 8,
              [ participant |->
                    ( p0 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> FALSE,
                            faulty |-> TRUE,
                            voteSent |-> TRUE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                      p1 :>
                          [ decision |-> undecided,
                            vote |-> yes,
                            alive |-> FALSE,
                            faulty |-> TRUE,
                            voteSent |-> FALSE,
                            forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
                coordinator |->
                    [ decision |-> undecided,
                      vote |-> (p0 :> yes @@ p1 :> waiting),
                      alive |-> FALSE,
                      faulty |-> TRUE,
                      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                      request |-> (p0 :> TRUE @@ p1 :> TRUE) ] ] >> >> },
  state |->
      { << 1,
           [ participant |->
                 ( p0 :>
                       [ decision |-> undecided,
                         vote |-> yes,
                         alive |-> TRUE,
                         faulty |-> FALSE,
                         voteSent |-> FALSE,
                         forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                   p1 :>
                       [ decision |-> undecided,
                         vote |-> yes,
                         alive |-> TRUE,
                         faulty |-> FALSE,
                         voteSent |-> FALSE,
                         forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
             coordinator |->
                 [ decision |-> undecided,
                   vote |-> (p0 :> waiting @@ p1 :> waiting),
                   alive |-> TRUE,
                   faulty |-> FALSE,
                   broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                   request |-> (p0 :> FALSE @@ p1 :> FALSE) ] ] >>,
        << 2,
           [ participant |->
                 ( p0 :>
                       [ decision |-> undecided,
                         vote |-> yes,
                         alive |-> TRUE,
                         faulty |-> FALSE,
                         voteSent |-> FALSE,
                         forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                   p1 :>
                       [ decision |-> undecided,
                         vote |-> yes,
                         alive |-> TRUE,
                         faulty |-> FALSE,
                         voteSent |-> FALSE,
                         forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
             coordinator |->
                 [ decision |-> undecided,
                   vote |-> (p0 :> waiting @@ p1 :> waiting),
                   alive |-> TRUE,
                   faulty |-> FALSE,
                   broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                   request |-> (p0 :> TRUE @@ p1 :> FALSE) ] ] >>,
        << 3,
           [ participant |->
                 ( p0 :>
                       [ decision |-> undecided,
                         vote |-> yes,
                         alive |-> TRUE,
                         faulty |-> FALSE,
                         voteSent |-> TRUE,
                         forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                   p1 :>
                       [ decision |-> undecided,
                         vote |-> yes,
                         alive |-> TRUE,
                         faulty |-> FALSE,
                         voteSent |-> FALSE,
                         forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
             coordinator |->
                 [ decision |-> undecided,
                   vote |-> (p0 :> waiting @@ p1 :> waiting),
                   alive |-> TRUE,
                   faulty |-> FALSE,
                   broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                   request |-> (p0 :> TRUE @@ p1 :> FALSE) ] ] >>,
        << 4,
           [ participant |->
                 ( p0 :>
                       [ decision |-> undecided,
                         vote |-> yes,
                         alive |-> TRUE,
                         faulty |-> FALSE,
                         voteSent |-> TRUE,
                         forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                   p1 :>
                       [ decision |-> undecided,
                         vote |-> yes,
                         alive |-> TRUE,
                         faulty |-> FALSE,
                         voteSent |-> FALSE,
                         forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
             coordinator |->
                 [ decision |-> undecided,
                   vote |-> (p0 :> waiting @@ p1 :> waiting),
                   alive |-> TRUE,
                   faulty |-> FALSE,
                   broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                   request |-> (p0 :> TRUE @@ p1 :> TRUE) ] ] >>,
        << 5,
           [ participant |->
                 ( p0 :>
                       [ decision |-> undecided,
                         vote |-> yes,
                         alive |-> TRUE,
                         faulty |-> FALSE,
                         voteSent |-> TRUE,
                         forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                   p1 :>
                       [ decision |-> undecided,
                         vote |-> yes,
                         alive |-> TRUE,
                         faulty |-> FALSE,
                         voteSent |-> FALSE,
                         forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
             coordinator |->
                 [ decision |-> undecided,
                   vote |-> (p0 :> yes @@ p1 :> waiting),
                   alive |-> TRUE,
                   faulty |-> FALSE,
                   broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                   request |-> (p0 :> TRUE @@ p1 :> TRUE) ] ] >>,
        << 6,
           [ participant |->
                 ( p0 :>
                       [ decision |-> undecided,
                         vote |-> yes,
                         alive |-> TRUE,
                         faulty |-> FALSE,
                         voteSent |-> TRUE,
                         forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                   p1 :>
                       [ decision |-> undecided,
                         vote |-> yes,
                         alive |-> TRUE,
                         faulty |-> FALSE,
                         voteSent |-> FALSE,
                         forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
             coordinator |->
                 [ decision |-> undecided,
                   vote |-> (p0 :> yes @@ p1 :> waiting),
                   alive |-> FALSE,
                   faulty |-> TRUE,
                   broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                   request |-> (p0 :> TRUE @@ p1 :> TRUE) ] ] >>,
        << 7,
           [ participant |->
                 ( p0 :>
                       [ decision |-> undecided,
                         vote |-> yes,
                         alive |-> FALSE,
                         faulty |-> TRUE,
                         voteSent |-> TRUE,
                         forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                   p1 :>
                       [ decision |-> undecided,
                         vote |-> yes,
                         alive |-> TRUE,
                         faulty |-> FALSE,
                         voteSent |-> FALSE,
                         forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
             coordinator |->
                 [ decision |-> undecided,
                   vote |-> (p0 :> yes @@ p1 :> waiting),
                   alive |-> FALSE,
                   faulty |-> TRUE,
                   broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                   request |-> (p0 :> TRUE @@ p1 :> TRUE) ] ] >>,
        << 8,
           [ participant |->
                 ( p0 :>
                       [ decision |-> undecided,
                         vote |-> yes,
                         alive |-> FALSE,
                         faulty |-> TRUE,
                         voteSent |-> TRUE,
                         forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
                   p1 :>
                       [ decision |-> undecided,
                         vote |-> yes,
                         alive |-> FALSE,
                         faulty |-> TRUE,
                         voteSent |-> FALSE,
                         forward |-> (p0 :> notsent @@ p1 :> notsent) ] ),
             coordinator |->
                 [ decision |-> undecided,
                   vote |-> (p0 :> yes @@ p1 :> waiting),
                   alive |-> FALSE,
                   faulty |-> TRUE,
                   broadcast |-> (p0 :> notsent @@ p1 :> notsent),
                   request |-> (p0 :> TRUE @@ p1 :> TRUE) ] ] >> } ]

================================================================================

(*--- recorded
all:
  exit: 13
  transcript: |-
    2212:0 Implied-temporal checking--satisfiability problem has 4 branches.
    2269:0 Computed 2 initial states...
    2190:0 Finished computing initial states: 4 distinct states generated at <date>.
    2192:0 Checking 4 branches of temporal properties for the complete state space with 17136 total distinct states at (<date>)
    2116:1 Temporal property AllMustCommit was violated.
    2264:1 The following behavior constitutes a counter-example:
    2217:4 1: <Initial predicate>
    /\ coordinator = [ decision |-> undecided,
      vote |-> (p0 :> waiting @@ p1 :> waiting),
      alive |-> TRUE,
      faulty |-> FALSE,
      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
      request |-> (p0 :> FALSE @@ p1 :> FALSE) ]
    /\ participant = ( p0 :>
          [ decision |-> undecided,
            vote |-> yes,
            alive |-> TRUE,
            faulty |-> FALSE,
            voteSent |-> FALSE,
            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
      p1 :>
          [ decision |-> undecided,
            vote |-> yes,
            alive |-> TRUE,
            faulty |-> FALSE,
            voteSent |-> FALSE,
            forward |-> (p0 :> notsent @@ p1 :> notsent) ] )
    2217:4 2: <request(p0) line 100, col 15 to line 105, col 41 of module ACP_SB>
    /\ coordinator = [ decision |-> undecided,
      vote |-> (p0 :> waiting @@ p1 :> waiting),
      alive |-> TRUE,
      faulty |-> FALSE,
      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
      request |-> (p0 :> TRUE @@ p1 :> FALSE) ]
    /\ participant = ( p0 :>
          [ decision |-> undecided,
            vote |-> yes,
            alive |-> TRUE,
            faulty |-> FALSE,
            voteSent |-> FALSE,
            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
      p1 :>
          [ decision |-> undecided,
            vote |-> yes,
            alive |-> TRUE,
            faulty |-> FALSE,
            voteSent |-> FALSE,
            forward |-> (p0 :> notsent @@ p1 :> notsent) ] )
    2217:4 3: <sendVote(p0) line 211, col 16 to line 216, col 42 of module ACP_SB>
    /\ coordinator = [ decision |-> undecided,
      vote |-> (p0 :> waiting @@ p1 :> waiting),
      alive |-> TRUE,
      faulty |-> FALSE,
      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
      request |-> (p0 :> TRUE @@ p1 :> FALSE) ]
    /\ participant = ( p0 :>
          [ decision |-> undecided,
            vote |-> yes,
            alive |-> TRUE,
            faulty |-> FALSE,
            voteSent |-> TRUE,
            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
      p1 :>
          [ decision |-> undecided,
            vote |-> yes,
            alive |-> TRUE,
            faulty |-> FALSE,
            voteSent |-> FALSE,
            forward |-> (p0 :> notsent @@ p1 :> notsent) ] )
    2217:4 4: <request(p1) line 100, col 15 to line 105, col 41 of module ACP_SB>
    /\ coordinator = [ decision |-> undecided,
      vote |-> (p0 :> waiting @@ p1 :> waiting),
      alive |-> TRUE,
      faulty |-> FALSE,
      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
      request |-> (p0 :> TRUE @@ p1 :> TRUE) ]
    /\ participant = ( p0 :>
          [ decision |-> undecided,
            vote |-> yes,
            alive |-> TRUE,
            faulty |-> FALSE,
            voteSent |-> TRUE,
            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
      p1 :>
          [ decision |-> undecided,
            vote |-> yes,
            alive |-> TRUE,
            faulty |-> FALSE,
            voteSent |-> FALSE,
            forward |-> (p0 :> notsent @@ p1 :> notsent) ] )
    2217:4 5: <getVote(p0) line 118, col 15 to line 126, col 41 of module ACP_SB>
    /\ coordinator = [ decision |-> undecided,
      vote |-> (p0 :> yes @@ p1 :> waiting),
      alive |-> TRUE,
      faulty |-> FALSE,
      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
      request |-> (p0 :> TRUE @@ p1 :> TRUE) ]
    /\ participant = ( p0 :>
          [ decision |-> undecided,
            vote |-> yes,
            alive |-> TRUE,
            faulty |-> FALSE,
            voteSent |-> TRUE,
            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
      p1 :>
          [ decision |-> undecided,
            vote |-> yes,
            alive |-> TRUE,
            faulty |-> FALSE,
            voteSent |-> FALSE,
            forward |-> (p0 :> notsent @@ p1 :> notsent) ] )
    2217:4 6: <coordDie line 196, col 13 to line 198, col 39 of module ACP_SB>
    /\ coordinator = [ decision |-> undecided,
      vote |-> (p0 :> yes @@ p1 :> waiting),
      alive |-> FALSE,
      faulty |-> TRUE,
      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
      request |-> (p0 :> TRUE @@ p1 :> TRUE) ]
    /\ participant = ( p0 :>
          [ decision |-> undecided,
            vote |-> yes,
            alive |-> TRUE,
            faulty |-> FALSE,
            voteSent |-> TRUE,
            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
      p1 :>
          [ decision |-> undecided,
            vote |-> yes,
            alive |-> TRUE,
            faulty |-> FALSE,
            voteSent |-> FALSE,
            forward |-> (p0 :> notsent @@ p1 :> notsent) ] )
    2217:4 7: <parDie(p0) line 280, col 14 to line 284, col 40 of module ACP_SB>
    /\ coordinator = [ decision |-> undecided,
      vote |-> (p0 :> yes @@ p1 :> waiting),
      alive |-> FALSE,
      faulty |-> TRUE,
      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
      request |-> (p0 :> TRUE @@ p1 :> TRUE) ]
    /\ participant = ( p0 :>
          [ decision |-> undecided,
            vote |-> yes,
            alive |-> FALSE,
            faulty |-> TRUE,
            voteSent |-> TRUE,
            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
      p1 :>
          [ decision |-> undecided,
            vote |-> yes,
            alive |-> TRUE,
            faulty |-> FALSE,
            voteSent |-> FALSE,
            forward |-> (p0 :> notsent @@ p1 :> notsent) ] )
    2217:4 8: <parDie(p1) line 280, col 14 to line 284, col 40 of module ACP_SB>
    /\ coordinator = [ decision |-> undecided,
      vote |-> (p0 :> yes @@ p1 :> waiting),
      alive |-> FALSE,
      faulty |-> TRUE,
      broadcast |-> (p0 :> notsent @@ p1 :> notsent),
      request |-> (p0 :> TRUE @@ p1 :> TRUE) ]
    /\ participant = ( p0 :>
          [ decision |-> undecided,
            vote |-> yes,
            alive |-> FALSE,
            faulty |-> TRUE,
            voteSent |-> TRUE,
            forward |-> (p0 :> notsent @@ p1 :> notsent) ] @@
      p1 :>
          [ decision |-> undecided,
            vote |-> yes,
            alive |-> FALSE,
            faulty |-> TRUE,
            voteSent |-> FALSE,
            forward |-> (p0 :> notsent @@ p1 :> notsent) ] )
    2218:4 9: Stuttering
    2267:0 Finished checking temporal properties in <time> at <date>
    2199:0 23988 states generated, 4284 distinct states found, 0 states left on queue.
    2194:0 The depth of the complete state graph search is 19.
---*)
