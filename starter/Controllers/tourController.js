const sharp = require('sharp')
const multer = require('multer')
const fs = require('fs');
const tours = JSON.parse(
    fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
  );

const Tour = require('./../models/tourmodel.js');
const catchAsync = require('./../utilities/catchAsync')
const AppError = require('./../utilities/appError')
const factory = require('./handlerFactory');

const multerStorage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true)
    } else {
        cb( new AppError('Please upload only images', 404), false)
    }
};
const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter
});

exports.uploadTourImages = upload.fields([
    {name: 'imageCover', maxCount: 1},
    {name: 'images', maxCount: 3}
])

exports.resizeTourImages = catchAsync(async(req, res, next) => {

    if (!req.files.imageCover || !req.files.images) return next();

    // 1) Cover image
    req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`
    await sharp(req.files.imageCover[0].buffer)
    .resize(2000, 1333)
    .toFormat('jpeg')
    .jpeg({quality: 90})
    .toFile(`public/img/tours/${req.body.imageCover}`);

    // 2) Images
    await Promise.all(
    req.files.images.map(async(file, i) => {
        const filename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

            await sharp(file.buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({quality: 90})
            .toFile(`public/img/tours/${filename}`);
        
        req.body.images.push(filename);

    })
    );
    next();
});

// //////////////////
// To get all tours from file to postman
// /////////////////

// exports.getalltours = async(req,res, next) => {

//    try{

//     //BUILD QUERY

//     // 1) Filtering
//     const queryObj = {...req.query};
//     const excludeFields = ['page', 'short', 'limit', 'fields'];
//     excludeFields.forEach(el => delete queryObj[el]);
//     console.log(req.query, queryObj);

//     // 2) Advanced filtering
//     // let querystr = JSON.stringify(queryObj);
//     // querystr = querystr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);
//     // console.log(JSON.parse(querystr));

//     // const query = await Tour.find(queryObj);
  
//     // const tours = await Tour.find()
//     // .where('duration')
//     // .equals(5)
//     // .where('difficulty')
//     // .equals('easy');


//     //EXECUTE QUERY
//     const tours = await query();

//     //SEND QUERY
//     res.status(200).json({
//         status: 'success',
//         results: tours.length,
//         data: {
//             tours
//         }
//     });
//    } catch (err) {
//        res.status(407).json({
//            status:'fail',
//            message: 'err',
//        });
//    }
//};


exports.getalltours = factory.getAll(Tour);




////////////////////
// To get tour from file to postman
///////////////////

exports.getTour = factory.getOne(Tour, { path: 'reviews' })
    // console.log(req.params);

    // const id = req.params.id * 1;
    // const tour = tours.find(el=> el.id ===id);

    // if(id> tours.length){
    //     return res.status(404).json({
    //         status: 'fail',
    //         message: 'File not found',
    //     })


    // res.status(200).json({
    //      status: 'success',
    //     data: {
    //         tour
    //     }
    // })


////////////////////
// To create a tour
///////////////////


exports.createTour = factory.createOne(Tour);
//    try {
//     // console.log(req.body);
//     // const newTours = new Tour({

//    } catch (err) {
//        res.status(404).json({
//            status: 'fail' ,
//            message: (err)
//        })
//    }
    

////////////////////
// To update a tour 
///////////////////

exports.updateTour = factory.updateOne(Tour);
////////////////////
// To delete some code in Postman we do like this 
///////////////////

exports.deleteTour = factory.deleteOne(Tour);

// exports.deleteTour =  catchAsync(async (req,res, next) => {

//     // if(req.params.id * 1 > tours.length){
//     //     return res.status(404).json({
//     //         status: 'fail',
//     //         message: 'File not found',
//     //     });
//     // }
 


//         await Tour.findByIdAndUpdate(req.params.id);

//         const tour = await Tour.findByIdAndDelete(req.params.id);

//         if (!tour) {
//             return  next(new AppError('No tour found that ID', 404))
//           }


//         res.status(204).json({
//             status: 'success',
//             data: null
//         });
//     })
    
exports.getTourStats = catchAsync(async (req, res, next) => {


        const stats = await Tour.aggregate([
            {
                $match: { ratingsAverage: { $gte: 4.5 }}
            },
            {
                $group: {
                    _id: null,  
                    avgRating: { $avg: '$ratingsAverage'},
                    avgPrice: { $avg: '$price'},
                    minPrice: { $min: '$price'},
                    maxPrice: { $max: '$price'},
                }
            } 
        ]);
        res.status(200).json({
            status: 'success',
            data: {
                stats
            }
        })
    })


    /////////////////////////////////////////////////////////////////
    // to get the tours/data with in a specfic area
    /////////////////////////////////////////////////////////////////

    // tours-within/23/center/34,-118/unit/mi
    exports.getTourWithin = catchAsync(async (req, res, next) => {
        const { distance, latlang, unit } = req.params; 
        const [lat, lng] = latlng.split(',');

        const radian = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;

        if(!lat || !lng) {
            next(
                new AppError(
                    'Please provide latitude and longnitude in the fomat lat, lng.', 400
                )
            )
        }

        const tours = await Tour.find({ startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radian] } } });
        
        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: {
                data: tours
            }
        });
    });

     
//////////////////////////////////
//to get out when was more traffic for a specific time
/////////////////////////////////



// exports.getMonthlyPlan = async (req, res) => {
//     try {
//         const year = req.params.year * 1;

//         const plan = await Tour.aggregate([

//         {
//             $unwind: '$startDates'
//         },
//         {
//             $match: {
//                 startDates: {
//                     $gte: new Date(`${year}-01/01`),
//                     $lte: new Date(`${year}-12-31`)
//                 }
//             }
//         },
//         {
//             $group: {
//                 _id: { $month: 'startDates'},
//                 numTourStarts: { $add: 1},
//                 tours: { $push: '$name' } 
//             }
//         },
//         {
//             $addFields: { month: '$_id'}
//         },
//         {
//             $project: {
//                 _id: 0
//             }
//         },
//         {
//             $short: {numTourStart: -1 }
//         },
//         {
//             $limit: 6
//         }
//         ])

//         res.status(200).json({
//             status: 'success',
//             data: {
//                 stats
//             }
//         })

//     } catch (err) {
//         res.status(404).json({
//             status: 'fail',
//             message: 'err'
//         });
//     } 
// }






////////////////////////////////////////////////////////////////////////////
//////Before making a real api 
///////////////////////////////////////////////////////////////////////////



// // const fs = require('fs');
// // const Tour = require('./../models/tourmodel.js');
// // const tours = JSON.parse(
// //     fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
// // );



// // exports.checkbody = (req, res, next) => {
// //     if(!req.body.name || !req.body.price) {
// //         return res.status(404).json({
// //             status: 'fail',
// //             message: 'Missing name or price'
// //         });
// //     }
// //  next();
// // };




// /////////////////////////////////////////////////////
// // To get all tours from file to postman
// /////////////////////////////////////////////////////



// exports.getalltours = (req,res) => {
//     console.log(req.requestTime)
//     res.status(200).json({
//         requestedAt: req.requestTime,
//         status: 'success',
//         // results: tours.length,
//         // data: {
//         //     tours
//         // }
//     })
// };

// ////////////////////
// // To get tour from file to postman
// ///////////////////

// exports.getTour = (req,res) => {
//     console.log(req.params);

//     const id = req.params.id * 1;
//     // const tour = tours.find(el=> el.id ===id);

//     // if(id> tours.length){
//     //     return res.status(404).json({
//     //         status: 'fail',
//     //         message: 'File not found',
//     //     })


//     // res.status(200).json({
//     //     status: 'success',
//     //     data: {
//     //         tour
//     //     }
//     // })
// };

// ////////////////////
// // To create a tour
// ///////////////////

// exports.createTour = (req, res) => {
//     // console.log(req.body);

//     res.status(201).json({
//         status: 'success',
//         // data: {
//         //     tour: newTour
//         // }
//     });
// }
// ////////////////////
// // To update a tour 
// ///////////////////

// exports.updateTour = (req,res) => {

//     // if(req.params.id * 1 > tours.length){
//     //     return res.status(404).json({
//     //         status: 'fail',
//     //         message: 'File not found',
//     //     });
//     // }

//     res.status(200).json({
//         status: 'success',
//         data: {
//             tours: '<updated tour is here>....'
//         }
//     })
// }

// ////////////////////
// // To delete some code in Postman we do like this 
// ///////////////////

// exports.deleteTour = (req,res) => {

//     // if(req.params.id * 1 > tours.length){
//     //     return res.status(404).json({
//     //         status: 'fail',
//     //         message: 'File not found',
//     //     });
//     // }
 
//     res.status(204).json({
//         status: 'success',
//         data: null
//     })
// }


