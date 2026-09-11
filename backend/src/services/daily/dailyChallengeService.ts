import {
  FieldValue,
} from 'firebase-admin/firestore'

import { db } from '../../config/firebase.js'

import {
  generateGameQuestion,
} from '../game/gameQuestionService.js'

import type {
  Question,
} from '../game/gameTypes.js'

import {
  getDailyTheme,
  getDailyTwist,
} from './dailyChallengeUtils.js'

import type {
  DailyChallenge,
} from './dailyChallengeTypes.js'

const DAILY_QUESTION_COUNT = 10

const dailyChallengesCollection =
  db.collection('dailyChallenges')

function getToday(): string {
  return new Date()
    .toISOString()
    .split('T')[0]
}

export async function getDailyChallenge(): Promise<DailyChallenge> {
  const date = getToday()

  const challengeRef =
    dailyChallengesCollection.doc(date)

  const existing =
    await challengeRef.get()

  if (existing.exists) {
    return existing.data() as DailyChallenge
  }

  const theme =
    getDailyTheme(date)

  const twist =
    getDailyTwist(date)

  const questions: Question[] = []

  for (
    let index = 0;
    index < DAILY_QUESTION_COUNT;
    index++
  ) {
    const question =
      await generateGameQuestion(
        'name-the-song',
        'medium',
      )

    questions.push(question)
  }

  const challenge: DailyChallenge = {
    id: date,
    date,
    theme,
    twist,
    questions,
    questionCount:
      DAILY_QUESTION_COUNT,
  }

  await challengeRef.create({
    ...challenge,
    createdAt:
      FieldValue.serverTimestamp(),
  })

  return challenge
}