/**
 * Helper Script to Find Valid Question IDs
 * 
 * This script queries your database to find existing question IDs
 * that you can use in the tests.
 * 
 * Usage: npx ts-node tests/helpers/findQuestions.ts
 * Or: node -r ts-node/register tests/helpers/findQuestions.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findQuestions() {
    console.log('\n' + '='.repeat(60));
    console.log('FINDING EXISTING QUESTIONS IN DATABASE');
    console.log('='.repeat(60) + '\n');

    try {
        // Get total count
        const totalCount = await prisma.question.count();
        console.log(`📊 Total questions in database: ${totalCount}\n`);

        if (totalCount === 0) {
            console.log('⚠️  No questions found in the database!');
            console.log('\n💡 Suggestions:');
            console.log('   1. Create some questions through your API or frontend');
            console.log('   2. Run the seed script if you have one');
            console.log('   3. Manually insert test data using Prisma Studio\n');
            return;
        }

        // Get first 10 questions
        console.log('📝 First 10 questions:\n');
        const questions = await prisma.question.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: {
                        id: true,
                        username: true
                    }
                },
                _count: {
                    select: {
                        comments: true,
                        vote: true
                    }
                }
            }
        });

        questions.forEach((question, index) => {
            console.log(`${index + 1}. ID: ${question.id}`);
            console.log(`   Title: ${question.title}`);
            console.log(`   Author: ${question.user.username} (ID: ${question.user.id})`);
            console.log(`   Comments: ${question._count.comments} | Votes: ${question._count.vote}`);
            console.log(`   Created: ${question.createdAt.toLocaleString()}`);
            console.log(`   Upvotes: ${question.upvotes} | Downvotes: ${question.downvotes}`);
            console.log('');
        });

        console.log('='.repeat(60));
        console.log('📋 RECOMMENDED FOR TESTING:');
        console.log('='.repeat(60));
        console.log(`\n💡 Use Question ID: ${questions[0].id}`);
        console.log('\nUpdate in tests/question.test.js:');
        console.log(`   let EXISTING_QUESTION_ID = ${questions[0].id};\n`);

        // Show some stats
        console.log('='.repeat(60));
        console.log('📈 DATABASE STATISTICS:');
        console.log('='.repeat(60));
        
        const stats = await prisma.question.aggregate({
            _count: true,
            _avg: {
                upvotes: true,
                downvotes: true
            },
            _max: {
                upvotes: true,
                downvotes: true
            }
        });

        console.log(`\nTotal Questions: ${stats._count}`);
        console.log(`Average Upvotes: ${stats._avg.upvotes?.toFixed(2) || 0}`);
        console.log(`Average Downvotes: ${stats._avg.downvotes?.toFixed(2) || 0}`);
        console.log(`Max Upvotes: ${stats._max.upvotes || 0}`);
        console.log(`Max Downvotes: ${stats._max.downvotes || 0}`);

        // Get users who have questions
        const usersWithQuestions = await prisma.user.findMany({
            where: {
                questions: {
                    some: {}
                }
            },
            select: {
                id: true,
                username: true,
                email: true,
                _count: {
                    select: {
                        questions: true
                    }
                }
            },
            take: 5
        });

        console.log('\n' + '='.repeat(60));
        console.log('👥 TOP QUESTION AUTHORS:');
        console.log('='.repeat(60) + '\n');

        usersWithQuestions.forEach((user, index) => {
            console.log(`${index + 1}. ${user.username}`);
            console.log(`   User ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Questions: ${user._count.questions}`);
            console.log('');
        });

        console.log('='.repeat(60));
        console.log('✅ Done! Use the information above to configure your tests.');
        console.log('='.repeat(60) + '\n');

    } catch (error) {
        console.error('❌ Error querying database:', error);
        console.error('\n💡 Make sure:');
        console.error('   1. Your database is running');
        console.error('   2. Prisma is configured correctly');
        console.error('   3. You ran: npm run prisma:generate\n');
    } finally {
        await prisma.$disconnect();
    }
}

// Run the script
findQuestions();
